import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

import { ensureAiContextEngineObservability } from "../.agents/hooks/lib/ai-context-engine.mjs";

const execFileAsync = promisify(execFile);

async function openBrowser(url) {
  await execFileAsync("open", [url]);
}

async function main() {
  const status = await ensureAiContextEngineObservability(process.cwd(), {
    force: true,
  });
  if (!status.url) {
    throw new Error("Astrograph observability server did not report a browser URL.");
  }
  await openBrowser(status.url);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
