import { createHash } from "node:crypto";
import path from "node:path";

import Parser from "tree-sitter";
import javascript from "tree-sitter-javascript";
import tsLanguages from "tree-sitter-typescript";

import type { SupportedLanguage, SymbolKind } from "./types.ts";

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
  parentName?: string,
  rangeNode: Parser.SyntaxNode = node,
): ParsedSymbol | null {
  const name = extractIdentifierName(node, sourceText);
  if (!name) {
    return null;
  }

  const signature = normalizeWhitespace(
    nodeText(sourceText, rangeNode.startIndex, rangeNode.endIndex),
  );
  const qualifiedName = parentName ? `${parentName}.${name}` : name;

  return {
    id: buildSymbolId(relativePath, kind, qualifiedName, node.startIndex),
    name,
    qualifiedName,
    kind,
    signature,
    summary: signature,
    startLine: rangeNode.startPosition.row + 1,
    endLine: rangeNode.endPosition.row + 1,
    startByte: rangeNode.startIndex,
    endByte: rangeNode.endIndex,
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

function pushVariableSymbols(
  node: Parser.SyntaxNode,
  sourceText: string,
  relativePath: string,
  exported: boolean,
  symbols: ParsedSymbol[],
  rangeNode: Parser.SyntaxNode = node,
) {
  for (const declarator of node.namedChildren.filter(
    (child) => child.type === "variable_declarator",
  )) {
    const symbol = createSymbol(
      declarator,
      sourceText,
      relativePath,
      "constant",
      exported,
      undefined,
      rangeNode,
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
  symbols: ParsedSymbol[],
) {
  const body = node.childForFieldName("body");
  if (!body) {
    return;
  }

  for (const child of body.namedChildren) {
    if (child.type === "method_definition") {
      const symbol = createSymbol(
        child,
        sourceText,
        relativePath,
        "method",
        false,
        className,
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
  symbols: ParsedSymbol[],
  imports: ParsedImport[],
  rangeNode: Parser.SyntaxNode = node,
) {
  switch (node.type) {
    case "function_declaration": {
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "function",
        exported,
        undefined,
        rangeNode,
      );
      if (symbol) {
        symbols.push(symbol);
      }
      return;
    }
    case "class_declaration": {
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "class",
        exported,
        undefined,
        rangeNode,
      );
      if (symbol) {
        symbols.push(symbol);
        pushClassMembers(
          node,
          sourceText,
          relativePath,
          symbol.name,
          symbols,
        );
      }
      return;
    }
    case "interface_declaration":
    case "type_alias_declaration":
    case "enum_declaration": {
      const symbol = createSymbol(
        node,
        sourceText,
        relativePath,
        "type",
        exported,
        undefined,
        rangeNode,
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
        symbols,
        rangeNode,
      );
      return;
    }
    case "import_statement": {
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
  symbols: ParsedSymbol[],
  imports: ParsedImport[],
) {
  switch (node.type) {
    case "export_statement": {
      for (const child of node.namedChildren) {
        visitDeclarationNode(
          child,
          sourceText,
          relativePath,
          true,
          symbols,
          imports,
          node,
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
        symbols,
        imports,
      );
  }
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
}): ParsedFile {
  parser.setLanguage(languageFor(input.language));
  const tree = parser.parse(input.content);
  const symbols: ParsedSymbol[] = [];
  const imports: ParsedImport[] = [];

  for (const child of tree.rootNode.namedChildren) {
    visitNode(child, input.content, input.relativePath, false, symbols, imports);
  }

  return {
    language: input.language,
    contentHash: sha256(input.content),
    symbols,
    imports,
  };
}
