#!/usr/bin/env node

import path from 'node:path';
import {
  getProjectRoot,
  getTouchedPaths,
  isDirectEntrypoint,
  normalizeToolPath,
  runHook,
} from './lib/core.mjs';
import { spawnAiContextEngineCli } from './lib/ai-context-engine.mjs';

const CODE_PATH_PATTERNS = [
  /(^|\/)(apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github)(\/|$)/i,
  /\.(?:js|jsx|mjs|ts|tsx)$/i,
];

function isCodeLikePath(filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  return CODE_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function spawnReindex(projectRoot, filePath) {
  const absolutePath = path.resolve(projectRoot, filePath);
  const relativePath = path.relative(projectRoot, absolutePath);
  const child = spawnAiContextEngineCli(
    projectRoot,
    ['index-file', '--repo', projectRoot, '--file', relativePath],
    { detached: true },
  );
  child.unref();
}

export async function handleAiContextEngineReindex(payload) {
  const projectRoot = getProjectRoot(payload);
  const touchedPaths = [...new Set(getTouchedPaths(payload).filter(isCodeLikePath))];

  for (const filePath of touchedPaths) {
    try {
      spawnReindex(projectRoot, filePath);
    } catch {
      // Reindexing is best-effort only.
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('ai-context-engine-reindex', handleAiContextEngineReindex);
}
