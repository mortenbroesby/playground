#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

function usage() {
  process.stderr.write(
    [
      "Usage:",
      "  ai-context-engine cli <args...>",
      "  ai-context-engine mcp",
    ].join("\n") + "\n",
  );
}

const [mode, ...args] = process.argv.slice(2);

const sourceTarget =
  mode === "cli"
    ? path.join(packageRoot, "src", "cli.ts")
    : mode === "mcp"
      ? path.join(packageRoot, "src", "mcp.ts")
      : null;
const distTarget =
  mode === "cli"
    ? path.join(packageRoot, "dist", "cli.js")
    : mode === "mcp"
      ? path.join(packageRoot, "dist", "mcp.js")
      : null;

if (!sourceTarget || !distTarget) {
  usage();
  process.exit(1);
}

// In the workspace, prefer source so local MCP/CLI runs reflect current edits.
// Installed packages do not ship src/, so they naturally fall back to dist/.
const useBuiltTarget = !existsSync(sourceTarget) && existsSync(distTarget);
const nodeArgs = mode === "mcp" ? ["--no-warnings"] : [];
const child = spawn(
  process.execPath,
  useBuiltTarget
    ? [...nodeArgs, distTarget, ...args]
    : [...nodeArgs, "--experimental-strip-types", sourceTarget, ...args],
  {
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
