import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";

import { loadRepoEngineConfig, resolveEnginePaths } from "./config.ts";
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
const REDACTED_SOURCE_TEXT = "[REDACTED:source-text]";
const REDACTED_SECRET = "[REDACTED:secret]";
const SOURCE_LIKE_KEYS = new Set([
  "content",
  "preview",
  "source",
  "text",
]);
const SECRET_VALUE_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
];

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

function redactSecretLikeString(value: string): string {
  let nextValue = value;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    nextValue = nextValue.replace(pattern, REDACTED_SECRET);
  }
  return nextValue;
}

function sanitizeEventValue(
  value: unknown,
  pathSegments: string[],
  redactSourceText: boolean,
): unknown {
  if (typeof value === "string") {
    const secretRedacted = redactSecretLikeString(value);
    if (
      redactSourceText
      && pathSegments.some((segment) => SOURCE_LIKE_KEYS.has(segment))
    ) {
      return secretRedacted === value ? REDACTED_SOURCE_TEXT : REDACTED_SECRET;
    }
    return secretRedacted;
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      sanitizeEventValue(entry, pathSegments, redactSourceText));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeEventValue(entry, [...pathSegments, key], redactSourceText),
      ]),
    );
  }

  return value;
}

export async function appendEngineEvent(
  input: EngineEventInput,
): Promise<EngineEventEnvelope> {
  const repoConfig = await loadRepoEngineConfig(input.repoRoot);
  const envelope = buildEventEnvelope({
    ...input,
    repoRoot: repoConfig.repoRoot,
    data: sanitizeEventValue(
      input.data ?? {},
      [],
      repoConfig.observability.redactSourceText,
    ) as Record<string, unknown>,
  });
  const paths = resolveEnginePaths(repoConfig.repoRoot);
  const line = `${JSON.stringify(envelope)}\n`;

  writeQueue = writeQueue.then(async () => {
    await mkdir(paths.storageDir, { recursive: true });
    await appendFile(paths.eventsPath, line, "utf8");
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
  const repoConfig = await loadRepoEngineConfig(input.repoRoot);
  const paths = resolveEnginePaths(repoConfig.repoRoot);
  const limit = Math.max(1, input.limit ?? 100);
  const contents = await readFile(paths.eventsPath, "utf8").catch(() => "");

  if (contents.trim() === "") {
    return [];
  }

  return contents
    .trimEnd()
    .split("\n")
    .slice(-limit)
    .map((line) => JSON.parse(line) as EngineEventEnvelope);
}
