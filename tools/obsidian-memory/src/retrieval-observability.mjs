import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export function createRetrievalObservability(options = {}) {
  const indexRoot = options.indexRoot;
  const eventLogPath = options.eventLogPath ?? path.join(indexRoot, "retrieval-events.jsonl");

  async function appendEvent(event) {
    await mkdir(path.dirname(eventLogPath), { recursive: true });
    await appendFile(eventLogPath, `${JSON.stringify(event)}\n`, "utf8");
  }

  return {
    eventLogPath,
    async logSearch(event) {
      await appendEvent({
        timestamp: new Date().toISOString(),
        tool: "memory_search",
        ...event,
      });
    },
    async logContext(event) {
      await appendEvent({
        timestamp: new Date().toISOString(),
        tool: "memory_context",
        ...event,
      });
    },
    async logUnfold(event) {
      await appendEvent({
        timestamp: new Date().toISOString(),
        tool: "memory_unfold",
        ...event,
      });
    },
    async readEvents() {
      try {
        const content = await readFile(eventLogPath, "utf8");
        return content
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line));
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          return [];
        }
        throw error;
      }
    },
  };
}
