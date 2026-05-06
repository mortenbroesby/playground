import fs from "node:fs";
import path from "node:path";

export interface UsageEntry {
  count: number;
  last_used_at: number;
}

export interface UsageCache {
  version: number;
  entries: Record<string, UsageEntry>;
}

const USAGE_CACHE_FILENAME = "usage-cache.local.json";
const USAGE_CACHE_DIRNAME = ".metadata";
const USAGE_CACHE_VERSION = 1;
const MAX_USAGE_COUNT = 4;
const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_RECENT_USAGE_SCORE = 2.5;

function createEmptyUsageCache(): UsageCache {
  return {
    version: USAGE_CACHE_VERSION,
    entries: {},
  };
}

function normalizeTimestamp(value: unknown, fallback = Date.now()): number {
  return Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value)
    : fallback;
}

function normalizeEntry(entry: unknown): UsageEntry | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const count = Number.isInteger(candidate.count as number)
    ? Math.min(Math.max(candidate.count as number, 1), MAX_USAGE_COUNT)
    : null;
  const lastUsedAt =
    typeof candidate.last_used_at === "number" && Number.isFinite(candidate.last_used_at)
      ? candidate.last_used_at
      : null;

  if (count === null || lastUsedAt === null || lastUsedAt < 0) {
    return null;
  }

  return {
    count,
    last_used_at: lastUsedAt,
  };
}

function normalizeCache(cache: unknown): UsageCache {
  if (!cache || typeof cache !== "object" || Array.isArray(cache)) {
    return createEmptyUsageCache();
  }

  const typed = cache as Partial<UsageCache>;
  const entries =
    typed.entries && typeof typed.entries === "object" && !Array.isArray(typed.entries)
      ? typed.entries
      : {};

  const normalizedEntries: Record<string, UsageEntry> = {};
  for (const skillId of Object.keys(entries).sort((left, right) =>
    left.localeCompare(right),
  )) {
    const normalizedEntry = normalizeEntry(entries[skillId]);
    if (normalizedEntry) {
      normalizedEntries[skillId] = normalizedEntry;
    }
  }

  return {
    version: USAGE_CACHE_VERSION,
    entries: normalizedEntries,
  };
}

export function getUsageCachePath(repoRoot: string): string {
  return path.join(repoRoot, ".skills", USAGE_CACHE_DIRNAME, USAGE_CACHE_FILENAME);
}

export function loadUsageCache(repoRoot: string): UsageCache {
  const usageCachePath = getUsageCachePath(repoRoot);
  if (!fs.existsSync(usageCachePath)) {
    return createEmptyUsageCache();
  }

  try {
    return normalizeCache(JSON.parse(fs.readFileSync(usageCachePath, "utf8")));
  } catch {
    return createEmptyUsageCache();
  }
}

export function writeUsageCache(repoRoot: string, cache: UsageCache): void {
  const usageCachePath = getUsageCachePath(repoRoot);
  fs.mkdirSync(path.dirname(usageCachePath), { recursive: true });
  fs.writeFileSync(
    usageCachePath,
    `${JSON.stringify(normalizeCache(cache), null, 2)}\n`,
  );
}

export function recordSkillUsage(
  repoRoot: string,
  skillId: string,
  now = Date.now(),
): void {
  if (typeof skillId !== "string" || skillId.trim() === "") {
    return;
  }

  const timestamp = normalizeTimestamp(now);
  const cache = loadUsageCache(repoRoot);
  const previousEntry = normalizeEntry(cache.entries[skillId]);
  const count = previousEntry
    ? Math.min(previousEntry.count + 1, MAX_USAGE_COUNT)
    : 1;

  cache.entries[skillId] = {
    count,
    last_used_at: previousEntry
      ? Math.max(previousEntry.last_used_at, timestamp)
      : timestamp,
  };

  writeUsageCache(repoRoot, cache);
}

export function getRecentUsageScore(
  cache: UsageCache,
  skillId: string,
  now = Date.now(),
): number {
  if (typeof skillId !== "string" || skillId.trim() === "") {
    return 0;
  }

  const entry = normalizeEntry(cache?.entries?.[skillId]);
  if (!entry) {
    return 0;
  }

  const timestamp = normalizeTimestamp(now);
  const ageMs = Math.max(0, timestamp - entry.last_used_at);
  const freshness = Math.exp(-ageMs / RECENCY_HALF_LIFE_MS);
  const repetitionBoost = 1 + (entry.count - 1) * 0.25;
  const score = Math.min(freshness * repetitionBoost * 1.5, MAX_RECENT_USAGE_SCORE);

  return Number(score.toFixed(3));
}
