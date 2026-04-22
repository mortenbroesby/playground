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

const useBuiltTarget = existsSync(distTarget);
const child = spawn(
  process.execPath,
  useBuiltTarget
    ? [distTarget, ...args]
    : ["--experimental-strip-types", sourceTarget, ...args],
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
