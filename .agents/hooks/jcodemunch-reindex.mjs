#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  getProjectRoot,
  getTouchedPaths,
  isDirectEntrypoint,
  normalizeToolPath,
  runHook,
} from './lib/core.mjs';

const CODE_PATH_PATTERNS = [
  /(^|\/)(apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github)(\/|$)/i,
  /\.(?:c|cc|cpp|cs|css|go|h|hpp|html|java|js|json|jsx|kt|mjs|php|py|rb|rs|scss|sh|sql|swift|toml|ts|tsx|vue|xml|yaml|yml)$/i,
];

function isCodeLikePath(filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  return CODE_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function spawnReindex(projectRoot, filePath) {
  const absolutePath = path.resolve(projectRoot, filePath);
  const child = spawn('jcodemunch-mcp', ['index-file', absolutePath], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

export async function handleJcodemunchReindex(payload) {
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
  runHook('jcodemunch-reindex', handleJcodemunchReindex);
}
