import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { createMemoryService } from "./mcp-memory-service.mjs";

const serverVersion = "1.0.0";

export function createObsidianMemoryMcpServer(options = {}) {
  const memoryService = createMemoryService(options);
  const server = new McpServer(
    {
      name: "playground-obsidian-memory",
      version: serverVersion,
    },
    {
      instructions:
        "Use memory_search for repo history and decisions, memory_context for the repo primer, and memory_unfold only after a search or context result points you at a specific source.",
    },
  );

  server.registerTool(
    "memory_search",
    {
      description:
        "Search the repo-local Obsidian RAG memory corpus for architecture, decisions, sessions, open questions, and historical context.",
      inputSchema: z.object({
        query: z.string().describe("Natural-language query to search for."),
        limit: z.number().optional().describe("Maximum results to return. Defaults to 5."),
        detail: z.enum(["compact", "full"]).optional().describe(
          "Response detail level. Defaults to compact; use full only when excerpts are insufficient.",
        ),
        repo_slug: z.string().optional().describe("Optional repo slug filter, for example playground."),
        note_type: z.string().optional().describe(
          "Optional note type filter, for example session, spec, architecture-record, or todo.",
        ),
        integrity_mode: z.enum([
          "prefer-healthy",
          "neutral",
          "prefer-warning",
          "exclude-warning",
        ]).optional().describe(
          "Optional integrity handling mode for warning-scoped notes. Defaults to prefer-healthy.",
        ),
        vector_mode: z.enum(["auto", "off"]).optional().describe(
          "Optional vector retrieval mode. Defaults to auto; use off to disable vector search explicitly.",
        ),
        retrieval_mode: z.enum(["default", "quality"]).optional().describe(
          "Optional retrieval mode. Defaults to default; use quality to widen the candidate pool for higher-cost retrieval.",
        ),
      }),
    },
    async (args) => {
      try {
        return textResult(await memoryService.searchMemory(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "memory_unfold",
    {
      description:
        "Fetch a specific memory chunk by source path, or by source file plus heading.",
      inputSchema: z.object({
        source_path: z.string().optional().describe(
          "Exact chunk path, for example vault/00 Repositories/playground/00 Repo Home.md § Active Focus.",
        ),
        source_file: z.string().optional().describe(
          "Source file path when looking up by heading, for example vault/00 Repositories/playground/00 Repo Home.md.",
        ),
        heading: z.string().optional().describe("Heading to fetch within source_file."),
      }),
    },
    async (args) => {
      try {
        return textResult(await memoryService.unfoldMemory(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "memory_context",
    {
      description:
        "Return the highest-signal context primer for this repo from the Obsidian memory corpus.",
      inputSchema: z.object({
        repo_slug: z.string().optional().describe("Repo slug to load context for. Defaults to playground."),
        detail: z.enum(["compact", "full"]).optional().describe(
          "Response detail level. Defaults to compact; use full only when the full repo primer is needed.",
        ),
      }),
    },
    async (args) => {
      try {
        return textResult(await memoryService.contextMemory(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "classify",
    {
      description:
        "Classify a memory-related request into the typed RAG workflow and suggest retrieval filters.",
      inputSchema: z.object({
        input: z.string().describe("Free-text memory request or statement to classify."),
      }),
    },
    async (args) => {
      try {
        return jsonResult(memoryService.classifyInput(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "propose_write",
    {
      description:
        "Preview a typed memory note write without mutating the vault. Returns the rendered note, target path, and duplicate proposals.",
      inputSchema: z.object({
        note_type: z.string().describe(
          "Typed note category such as spec, architecture-record, session, todo, investigation, reference, or glossary.",
        ),
        title: z.string().describe("Human-readable note title."),
        summary: z.string().describe("Short summary to store in frontmatter."),
        owner: z.string().optional().describe("Optional owner override for the proposed note."),
        repo_slug: z.string().optional().describe("Optional repo slug. Defaults to playground."),
      }),
    },
    async (args) => {
      try {
        return jsonResult(await memoryService.proposeWrite(args));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "clean_dry_run",
    {
      description:
        "Return the current memory cleanup report without deleting or rewriting anything.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return jsonResult(await memoryService.cleanDryRun());
      } catch (error) {
        return toolError(error);
      }
    },
  );

  return server;
}

function textResult(text) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

function jsonResult(value) {
  return {
    structuredContent: value,
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function toolError(error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  };
}
