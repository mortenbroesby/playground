import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const OBSERVABILITY_STATUS_PATH = path.join(
  process.cwd(),
  ".astrograph",
  "observability-server.json",
);

async function openBrowser(url) {
  await execFileAsync("open", [url]);
}

async function readExistingObservabilityUrl() {
  const contents = await readFile(OBSERVABILITY_STATUS_PATH, "utf8").catch(() => null);
  if (contents === null) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return null;
  }

  if (
    typeof parsed?.host !== "string"
    || typeof parsed?.port !== "number"
    || !Number.isInteger(parsed.port)
  ) {
    return null;
  }

  const url = `http://${parsed.host}:${parsed.port}/`;

  try {
    const response = await fetch(new URL("/health", url), {
      headers: {
        Accept: "application/json",
      },
    });
    return response.ok ? url : null;
  } catch {
    return null;
  }
}

async function main() {
  const existingUrl = await readExistingObservabilityUrl();
  if (existingUrl !== null) {
    await openBrowser(existingUrl);
    return;
  }

  const child = spawn(
    "pnpm",
    ["exec", "ai-context-engine", "observability", "--repo", process.cwd()],
    {
      stdio: ["inherit", "pipe", "inherit"],
    },
  );

  child.once("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  if (!child.stdout) {
    throw new Error("Astrograph observability server did not expose stdout.");
  }

  const lineReader = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  });

  let opened = false;

  lineReader.on("line", (line) => {
    if (!opened) {
      try {
        const startup = JSON.parse(line);
        const url = `http://${startup.host}:${startup.port}/`;
        opened = true;
        void openBrowser(url).catch((error) => {
          process.stderr.write(
            `${error instanceof Error ? error.message : String(error)}\n`,
          );
        });
      } catch {
        process.stdout.write(`${line}\n`);
      }
      return;
    }

    process.stdout.write(`${line}\n`);
  });

  child.stdout.on("data", () => {
    // Readline owns the stream; this keeps the process alive while attached.
  });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
