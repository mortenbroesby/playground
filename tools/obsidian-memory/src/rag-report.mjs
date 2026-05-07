#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { createRetrievalObservability } from "./retrieval-observability.mjs";

const defaultRepoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");

export function parseArgs(argv, options = {}) {
  const repoRoot = options.repoRoot ?? defaultRepoRoot;
  const parsed = {
    repoRoot,
    indexRoot: path.join(repoRoot, ".rag"),
    eventLogPath: path.join(repoRoot, ".rag", "retrieval-events.jsonl"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--index-root") {
      parsed.indexRoot = path.resolve(argv[index + 1] ?? parsed.indexRoot);
      parsed.eventLogPath = path.join(parsed.indexRoot, "retrieval-events.jsonl");
      index += 1;
      continue;
    }

    if (arg === "--events") {
      parsed.eventLogPath = path.resolve(argv[index + 1] ?? parsed.eventLogPath);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return parsed;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:report [--index-root .rag] [--events .rag/retrieval-events.jsonl]",
      "",
      "Summarise retrieval weak-use and strong-use events into reviewable buckets.",
    ].join("\n"),
  );
}

function resultMatchesTarget(result, target) {
  if (!result || !target) {
    return false;
  }

  return (
    (result.chunkId && target.chunkId && result.chunkId === target.chunkId) ||
    (result.sourcePath && target.sourcePath && result.sourcePath === target.sourcePath)
  );
}

function isVectorOnly(result) {
  const retrievalSources = Array.isArray(result?.retrievalSources) ? result.retrievalSources : [];
  return retrievalSources.includes("vector") && !retrievalSources.includes("lexical");
}

function summariseWeakOnlyQuery(event) {
  const results = Array.isArray(event.results) ? event.results : [];
  const top = results[0] ?? null;

  return {
    query: event.query,
    weakResultCount: results.length,
    topRank: top?.rank ?? null,
    topChunkId: top?.chunkId ?? null,
    topSourcePath: top?.sourcePath ?? null,
    vectorOnlyRanks: results.filter(isVectorOnly).map((result) => result.rank),
  };
}

function buildStrongUseFromLowerRank(entry) {
  const top = entry.search.results[0] ?? null;

  return {
    query: entry.search.query,
    selectedRank: entry.result.rank,
    selectedChunkId: entry.result.chunkId,
    selectedSourcePath: entry.result.sourcePath,
    topRankedChunkId: top?.chunkId ?? null,
    topRankedSourcePath: top?.sourcePath ?? null,
  };
}

function buildSemanticFalsePositives(strongUses, onlyWeakUseQueries) {
  const fromLowerRankWins = strongUses.flatMap((entry) => {
    const top = entry.search.results[0] ?? null;
    if (!top || top.rank === entry.result.rank || !isVectorOnly(top)) {
      return [];
    }

    return [{
      query: entry.search.query,
      rank: top.rank,
      chunkId: top.chunkId,
      sourcePath: top.sourcePath,
      retrievalSources: [...(top.retrievalSources ?? [])],
      reason: "top_rank_but_lower_rank_won",
    }];
  });

  const fromWeakOnlyQueries = onlyWeakUseQueries.flatMap((event) =>
    (event.results ?? [])
      .filter(isVectorOnly)
      .map((result) => ({
        query: event.query,
        rank: result.rank,
        chunkId: result.chunkId,
        sourcePath: result.sourcePath,
        retrievalSources: [...(result.retrievalSources ?? [])],
        reason: "only_weak_use_query",
      })),
  );

  return [...fromLowerRankWins, ...fromWeakOnlyQueries];
}

export async function runReport(options = {}) {
  const repoRoot = options.repoRoot ?? defaultRepoRoot;
  const indexRoot = options.indexRoot ?? path.join(repoRoot, ".rag");
  const retrievalObservability = createRetrievalObservability({
    indexRoot,
    eventLogPath: options.eventLogPath,
  });
  const events = await retrievalObservability.readEvents();
  const annotatedEvents = events.map((event, eventIndex) => ({ ...event, eventIndex }));
  const searchEvents = annotatedEvents.filter((event) => event.tool === "memory_search" && event.query);
  const contextEvents = annotatedEvents.filter((event) => event.tool === "memory_context");
  const unfoldEvents = annotatedEvents.filter((event) => event.tool === "memory_unfold" && event.target);

  const strongUses = [];
  const matchedQueryEventIndexes = new Set();

  for (const unfoldEvent of unfoldEvents) {
    const matchingSearch = [...searchEvents]
      .reverse()
      .find((searchEvent) =>
        searchEvent.eventIndex < unfoldEvent.eventIndex &&
        (searchEvent.results ?? []).some((result) => resultMatchesTarget(result, unfoldEvent.target)),
      );

    if (!matchingSearch) {
      continue;
    }

    const matchedResult = matchingSearch.results.find((result) =>
      resultMatchesTarget(result, unfoldEvent.target),
    );
    strongUses.push({
      search: matchingSearch,
      unfold: unfoldEvent,
      result: matchedResult,
    });
    matchedQueryEventIndexes.add(matchingSearch.eventIndex);
  }

  const onlyWeakUseQueryEvents = searchEvents.filter(
    (event) => !matchedQueryEventIndexes.has(event.eventIndex),
  );
  const strongUseFromLowerRank = strongUses
    .filter((entry) => (entry.result?.rank ?? 0) > 1)
    .map(buildStrongUseFromLowerRank);
  const semanticOnlyFalsePositives = buildSemanticFalsePositives(strongUses, onlyWeakUseQueryEvents);

  return {
    summary: {
      totalEvents: annotatedEvents.length,
      searchEvents: searchEvents.length,
      contextEvents: contextEvents.length,
      unfoldEvents: unfoldEvents.length,
      queries: searchEvents.length,
      onlyWeakUseQueries: onlyWeakUseQueryEvents.length,
      strongUseFromLowerRank: strongUseFromLowerRank.length,
      semanticOnlyFalsePositives: semanticOnlyFalsePositives.length,
    },
    buckets: {
      onlyWeakUseQueries: onlyWeakUseQueryEvents.map(summariseWeakOnlyQuery),
      strongUseFromLowerRank,
      semanticOnlyFalsePositives,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runReport(options);
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
