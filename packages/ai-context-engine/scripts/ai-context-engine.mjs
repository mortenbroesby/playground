#!/usr/bin/env node

import { spawn } from "node:child_process";
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

const target =
  mode === "cli"
    ? path.join(packageRoot, "src", "cli.ts")
    : mode === "mcp"
      ? path.join(packageRoot, "src", "mcp.ts")
      : null;

if (!target) {
  usage();
  process.exit(1);
}

const child = spawn(process.execPath, ["--experimental-strip-types", target, ...args], {
  stdio: "inherit",
});

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
