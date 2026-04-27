import { spawnSync } from "node:child_process";

const packagePathPrefix = "tools/ai-context-engine/";
const rawArgs = process.argv.slice(2);
const normalizedArgs = rawArgs.map((arg) =>
  arg.startsWith(packagePathPrefix) ? arg.slice(packagePathPrefix.length) : arg,
);

const result = spawnSync("vitest", ["run", ...normalizedArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
