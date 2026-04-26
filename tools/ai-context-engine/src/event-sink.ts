import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";

import { createDefaultEngineConfig } from "./config.ts";
import type {
  EngineEventEnvelope,
  EngineEventLevel,
  EngineEventSource,
} from "./types.ts";

export interface EngineEventInput {
  repoRoot: string;
  source: EngineEventSource;
  event: string;
  level: EngineEventLevel;
  correlationId?: string;
  data?: Record<string, unknown>;
}

let writeQueue = Promise.resolve();

function buildEventEnvelope(input: EngineEventInput): EngineEventEnvelope {
  return {
    id: randomUUID(),
    ts: new Date().toISOString(),
    repoRoot: input.repoRoot,
    source: input.source,
    event: input.event,
    level: input.level,
    correlationId: input.correlationId,
    data: input.data ?? {},
  };
}

export async function appendEngineEvent(
  input: EngineEventInput,
): Promise<EngineEventEnvelope> {
  const envelope = buildEventEnvelope(input);
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const line = `${JSON.stringify(envelope)}\n`;

  writeQueue = writeQueue.then(async () => {
    await mkdir(config.paths.storageDir, { recursive: true });
    await appendFile(config.paths.eventsPath, line, "utf8");
  });

  await writeQueue;
  return envelope;
}

export function emitEngineEvent(input: EngineEventInput): void {
  void appendEngineEvent(input).catch(() => {
    // Observability must not break primary MCP, CLI, or watch behavior.
  });
}

export async function readRecentEngineEvents(input: {
  repoRoot: string;
  limit?: number;
}): Promise<EngineEventEnvelope[]> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const limit = Math.max(1, input.limit ?? 100);
  const contents = await readFile(config.paths.eventsPath, "utf8").catch(() => "");

  if (contents.trim() === "") {
    return [];
  }

  return contents
    .trimEnd()
    .split("\n")
    .slice(-limit)
    .map((line) => JSON.parse(line) as EngineEventEnvelope);
}
