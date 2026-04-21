import { createHash } from "node:crypto";
import path from "node:path";

import Parser from "tree-sitter";
import javascript from "tree-sitter-javascript";
import tsLanguages from "tree-sitter-typescript";

import type {
  SummarySource,
  SummaryStrategy,
  SupportedLanguage,
  SymbolKind,
} from "./types.ts";

interface ParsedImport {
  source: string;
  specifiers: string[];
}

interface ParsedSymbol {
  id: string;
  name: string;
  qualifiedName: string | null;
  kind: SymbolKind;
  signature: string;
  summary: string;
  summarySource: SummarySource;
  startLine: number;
  endLine: number;
  startByte: number;
  endByte: number;
  exported: boolean;
}

export interface ParsedFile {
  language: SupportedLanguage;
  contentHash: string;
  symbols: ParsedSymbol[];
  imports: ParsedImport[];
}

const parser = new Parser();
const MAX_PARSE_BYTES = 24_000;
const TARGET_CHUNK_BYTES = 16_000;
const CHUNK_OVERLAP_BYTES = 8_000;

interface ParseOffset {
  byte: number;
  line: number;
}

interface OwnedLineRange {
  start: number;
  end: number;
}

interface SourceChunk extends ParseOffset, OwnedLineRange {
  content: string;
}

function isRecoverableParseFailure(error: unknown): boolean {
  return error instanceof Error && error.message === "Invalid argument";
}

function languageFor(language: SupportedLanguage) {
  switch (language) {
    case "ts":
      return tsLanguages.typescript;
    case "tsx":
      return tsLanguages.tsx;
    case "js":
    case "jsx":
      return javascript;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nodeText(sourceText: string, startByte: number, endByte: number): string {
  return sourceText.slice(startByte, endByte);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseCommentSummary(comment: string): string | null {
  const normalized = comment.startsWith("/*")
    ? comment
        .replace(/^\/\*+\s?/, "")
        .replace(/\*\/$/, "")
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, "").trim())
        .filter(Boolean)
    : comment
        .split("\n")
        .map((line) => line.replace(/^\s*\/\/+\s?/, "").trim())
        .filter(Boolean);

  const firstLine = normalized[0];
  return firstLine ? normalizeWhitespace(firstLine) : null;
}

function extractLeadingCommentSummary(
  node: Parser.SyntaxNode,
  sourceText: string,
): string | null {
  const prefix = sourceText.slice(0, node.startIndex);
  const match = prefix.match(
    /(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n[ \t]*\/\/[^\n]*)*)[ \t\r\n]*$/u,
  );

  if (!match) {
    return null;
  }

  const trailingWhitespaceMatch = match[0].match(/[ \t\r\n]*$/u);
  const trailingWhitespaceLength = trailingWhitespaceMatch?.[0].length ?? 0;
  const comment = match[0].slice(0, match[0].length - trailingWhitespaceLength).trim();
  const beforeComment = prefix.slice(0, prefix.length - match[0].length);
  const lastNewline = beforeComment.lastIndexOf("\n");
  const separator = beforeComment.slice(lastNewline + 1);
  if (separator.trim().length > 0) {
    return null;
  }

  return parseCommentSummary(comment);
}

function resolveSummary(input: {
  node: Parser.SyntaxNode;
  sourceText: string;
  signature: string;
  summaryStrategy: SummaryStrategy;
}): {
  summary: string;
  summarySource: SummarySource;
} {
  if (input.summaryStrategy === "doc-comments-first") {
    const commentSummary = extractLeadingCommentSummary(input.node, input.sourceText);
    if (commentSummary) {
      return {
        summary: commentSummary,
        summarySource: "doc-comment",
      };
    }
  }

  return {
    summary: input.signature,
    summarySource: "signature",
  };
}

function extractIdentifierName(node: Parser.SyntaxNode, sourceText: string): string | null {
  const nameNode =
    node.childForFieldName("name") ??
    node.namedChildren.find((child) =>
      [
        "identifier",
        "property_identifier",
        "type_identifier",
      ].includes(child.type),
    ) ??
    null;

  if (!nameNode) {
    return null;
  }

  return nodeText(sourceText, nameNode.startIndex, nameNode.endIndex);
}

function buildSymbolId(
  relativePath: string,
  kind: SymbolKind,
  name: string,
  startByte: number,
): string {
  return sha256(`${relativePath}:${kind}:${name}:${startByte}`).slice(0, 16);
}

function createSymbol(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  kind: SymbolKind,
  exported: boolean,
  summaryStrategy: SummaryStrategy,
  parentName?: string,
  rangeNode: Parser.SyntaxNode = node,
  offset: ParseOffset = { byte: 0, line: 0 },
): ParsedSymbol | null {
  const name = extractIdentifierName(node, sourceText);
  if (!name) {
    return null;
  }

  const signature = normalizeWhitespace(
    nodeText(sourceText, rangeNode.startIndex, rangeNode.endIndex),
  );
  const { summary, summarySource } = resolveSummary({
    node: rangeNode,
    sourceText,
    signature,
    summaryStrategy,
  });
  const qualifiedName = parentName ? `${parentName}.${name}` : name;

  return {
    id: buildSymbolId(relativePath, kind, qualifiedName, offset.byte + node.startIndex),
    name,
    qualifiedName,
    kind,
    signature,
    summary,
    summarySource,
    startLine: offset.line + rangeNode.startPosition.row + 1,
    endLine: offset.line + rangeNode.endPosition.row + 1,
    startByte: offset.byte + rangeNode.startIndex,
    endByte: offset.byte + rangeNode.endIndex,
    exported,
  };
}

function parseImport(
  node: Parser.SyntaxNode,
  sourceText: string,
): ParsedImport | null {
  const sourceNode = node.childForFieldName("source");
  if (!sourceNode) {
    return null;
  }

  const source = nodeText(sourceText, sourceNode.startIndex, sourceNode.endIndex)
    .replace(/^['"]|['"]$/g, "");
  const specifiers = node.namedChildren
    .filter((child) =>
      [
        "import_clause",
        "named_imports",
        "namespace_import",
        "identifier",
      ].includes(child.type),
    )
    .flatMap((child) =>
      child.namedChildren.length > 0 ? child.namedChildren : [child],
    )
    .flatMap((child) =>
      nodeText(sourceText, child.startIndex, child.endIndex)
        .replace(/[{}]/g, "")
        .split(",")
        .map((entry) => entry.trim()),
    )
    .map((raw) => {
      if (!raw) {
        return raw;
      }
      if (raw.startsWith("* as ")) {
        return raw.slice(5).trim();
      }
      const aliasIndex = raw.indexOf(" as ");
      return aliasIndex >= 0 ? raw.slice(0, aliasIndex).trim() : raw;
    })
    .filter(Boolean);

  return {
    source,
    specifiers,
  };
}

function ownsNode(
  node: Parser.SyntaxNode,
  offset: ParseOffset,
  ownedLines?: OwnedLineRange,
): boolean {
  if (!ownedLines) {
    return true;
  }

  const startLine = offset.line + node.startPosition.row;
  return startLine >= ownedLines.start && startLine < ownedLines.end;
}

function pushVariableSymbols(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  exported: boolean,
  summaryStrategy: SummaryStrategy,
  symbols: ParsedSymbol[],
  rangeNode: Parser.SyntaxNode = node,
  offset: ParseOffset = { byte: 0, line: 0 },
  ownedLines?: OwnedLineRange,
) {
  for (const declarator of node.namedChildren.filter(
    (child) => child.type === "variable_declarator",
  )) {
    if (!ownsNode(declarator, offset, ownedLines)) {
      continue;
    }
    const symbol = createSymbol(
      declarator,
      sourceText,
      relativePath,
      "constant",
      exported,
      summaryStrategy,
      undefined,
      rangeNode,
      offset,
    );
    if (symbol) {
      symbols.push(symbol);
    }
  }
}

function pushClassMembers(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  className: string,
  summaryStrategy: SummaryStrategy,
  symbols: ParsedSymbol[],
  offset: ParseOffset = { byte: 0, line: 0 },
  ownedLines?: OwnedLineRange,
) {
  const body = node.childForFieldName("body");
  if (!body) {
    return;
  }

  for (const child of body.namedChildren) {
    if (child.type === "method_definition") {
      if (!ownsNode(child, offset, ownedLines)) {
        continue;
      }
      const symbol = createSymbol(
        child,
        sourceText,
        relativePath,
        "method",
        false,
        summaryStrategy,
        className,
        child,
        offset,
      );
      if (symbol) {
        symbols.push(symbol);
      }
    }
  }
}

function visitDeclarationNode(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  exported: boolean,
  summaryStrategy: SummaryStrategy,
  symbols: ParsedSymbol[],
  imports: ParsedImport[],
  rangeNode: Parser.SyntaxNode = node,
  offset: ParseOffset = { byte: 0, line: 0 },
  ownedLines?: OwnedLineRange,
) {
  switch (node.type) {
    case "function_declaration": {
      if (!ownsNode(node, offset, ownedLines)) {
        return;
      }
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "function",
        exported,
        summaryStrategy,
        undefined,
        rangeNode,
        offset,
      );
      if (symbol) {
        symbols.push(symbol);
      }
      return;
    }
    case "class_declaration": {
      if (!ownsNode(node, offset, ownedLines)) {
        return;
      }
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "class",
        exported,
        summaryStrategy,
        undefined,
        rangeNode,
        offset,
      );
      if (symbol) {
        symbols.push(symbol);
        pushClassMembers(
          node,
          sourceText,
          relativePath,
          symbol.name,
          summaryStrategy,
          symbols,
          offset,
          ownedLines,
        );
      }
      return;
    }
    case "interface_declaration":
    case "type_alias_declaration":
    case "enum_declaration": {
      if (!ownsNode(node, offset, ownedLines)) {
        return;
      }
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "type",
        exported,
        summaryStrategy,
        undefined,
        rangeNode,
        offset,
      );
      if (symbol) {
        symbols.push(symbol);
      }
      return;
    }
    case "lexical_declaration":
    case "variable_declaration": {
      pushVariableSymbols(
        node,
        sourceText,
        relativePath,
        exported,
        summaryStrategy,
        symbols,
        rangeNode,
        offset,
        ownedLines,
      );
      return;
    }
    case "import_statement": {
      if (!ownsNode(node, offset, ownedLines)) {
        return;
      }
      const parsedImport = parseImport(node, sourceText);
      if (parsedImport) {
        imports.push(parsedImport);
      }
      return;
    }
    default:
      return;
  }
}

function visitNode(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  exported: boolean,
  summaryStrategy: SummaryStrategy,
  symbols: ParsedSymbol[],
  imports: ParsedImport[],
  offset: ParseOffset = { byte: 0, line: 0 },
  ownedLines?: OwnedLineRange,
) {
  switch (node.type) {
    case "export_statement": {
      for (const child of node.namedChildren) {
        visitDeclarationNode(
          child,
          sourceText,
          relativePath,
          true,
          summaryStrategy,
          symbols,
          imports,
          node,
          offset,
          ownedLines,
        );
      }
      return;
    }
    default:
      visitDeclarationNode(
        node,
        sourceText,
        relativePath,
        exported,
        summaryStrategy,
        symbols,
        imports,
        node,
        offset,
        ownedLines,
      );
  }
}

function splitSourceIntoChunks(sourceText: string): SourceChunk[] {
  const lines = sourceText.split("\n");

  if (sourceText.length <= MAX_PARSE_BYTES) {
    return [
      {
        content: sourceText,
        byte: 0,
        line: 0,
        start: 0,
        end: lines.length,
      },
    ];
  }

  const lineOffsets: number[] = [];
  let totalBytes = 0;
  for (let index = 0; index < lines.length; index += 1) {
    lineOffsets.push(totalBytes);
    totalBytes += lines[index].length + (index < lines.length - 1 ? 1 : 0);
  }

  const bytesBetween = (startLine: number, endLine: number) => {
    if (startLine >= endLine) {
      return 0;
    }
    const startByte = lineOffsets[startLine] ?? totalBytes;
    const endByte = endLine < lines.length ? lineOffsets[endLine] : totalBytes;
    return endByte - startByte;
  };

  const chunks: SourceChunk[] = [];
  let ownedStart = 0;

  while (ownedStart < lines.length) {
    let ownedEnd = ownedStart + 1;
    while (
      ownedEnd < lines.length &&
      bytesBetween(ownedStart, ownedEnd) < TARGET_CHUNK_BYTES
    ) {
      ownedEnd += 1;
    }

    let parseStart = ownedStart;
    while (
      parseStart > 0 &&
      bytesBetween(parseStart - 1, ownedEnd) <= MAX_PARSE_BYTES &&
      bytesBetween(parseStart - 1, ownedStart) <= CHUNK_OVERLAP_BYTES
    ) {
      parseStart -= 1;
    }

    let parseEnd = ownedEnd;
    while (
      parseEnd < lines.length &&
      bytesBetween(parseStart, parseEnd + 1) <= MAX_PARSE_BYTES &&
      bytesBetween(ownedEnd, parseEnd + 1) <= CHUNK_OVERLAP_BYTES
    ) {
      parseEnd += 1;
    }

    const content = lines.slice(parseStart, parseEnd).join("\n");
    if (content.length > 0) {
      chunks.push({
        content,
        byte: lineOffsets[parseStart] ?? 0,
        line: parseStart,
        start: ownedStart,
        end: ownedEnd,
      });
    }

    ownedStart = ownedEnd;
  }

  return chunks;
}

export function supportedLanguageForFile(filePath: string): SupportedLanguage | null {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".js":
      return "js";
    case ".jsx":
      return "jsx";
    default:
      return null;
  }
}

export function parseSourceFile(input: {
  relativePath: string;
  content: string;
  language: SupportedLanguage;
  summaryStrategy?: SummaryStrategy;
}): ParsedFile {
  parser.setLanguage(languageFor(input.language));
  const symbols: ParsedSymbol[] = [];
  const imports: ParsedImport[] = [];
  const summaryStrategy = input.summaryStrategy ?? "doc-comments-first";

  try {
    const tree = parser.parse(input.content);
    for (const child of tree.rootNode.namedChildren) {
      visitNode(
        child,
        input.content,
        input.relativePath,
        false,
        summaryStrategy,
        symbols,
        imports,
      );
    }
  } catch (error) {
    if (!isRecoverableParseFailure(error)) {
      throw error;
    }

    for (const chunk of splitSourceIntoChunks(input.content)) {
      try {
        const tree = parser.parse(chunk.content);
        for (const child of tree.rootNode.namedChildren) {
          visitNode(
            child,
            chunk.content,
            input.relativePath,
            false,
            summaryStrategy,
            symbols,
            imports,
            {
              byte: chunk.byte,
              line: chunk.line,
            },
            {
              start: chunk.start,
              end: chunk.end,
            },
          );
        }
      } catch (chunkError) {
        if (!isRecoverableParseFailure(chunkError)) {
          throw chunkError;
        }
      }
    }
  }

  return {
    language: input.language,
    contentHash: sha256(input.content),
    symbols,
    imports,
  };
}
