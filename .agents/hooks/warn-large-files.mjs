#!/usr/bin/env node

import path from 'node:path';
import {
  getTouchedPaths,
  isDirectEntrypoint,
  normalizeToolPath,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

const BLOCKED_DIRECTORY_PATTERNS = [
  { pattern: /(^|\/)node_modules(\/|$)/i, reason: 'Writing into node_modules/ is blocked. Use the package manager instead.' },
  { pattern: /(^|\/)vendor(\/|$)/i, reason: 'Writing into vendor/ is blocked. Use the dependency manager instead.' },
  { pattern: /(^|\/)__pycache__(\/|$)/i, reason: 'Writing into __pycache__/ is blocked.' },
  { pattern: /(^|\/)(?:\.venv|venv)(\/|$)/i, reason: 'Writing into virtual environment directories is blocked.' },
];

const BLOCKED_BINARY_EXTENSIONS = new Set([
  '.a',
  '.avi',
  '.class',
  '.dll',
  '.dylib',
  '.exe',
  '.flac',
  '.mkv',
  '.mov',
  '.mp3',
  '.mp4',
  '.o',
  '.pyc',
  '.pyo',
  '.rar',
  '.so',
  '.tar',
  '.tgz',
  '.wasm',
  '.wav',
  '.zip',
]);

function getArtifactReason(filePath) {
  const normalizedPath = normalizeToolPath(filePath);

  for (const rule of BLOCKED_DIRECTORY_PATTERNS) {
    if (rule.pattern.test(normalizedPath)) {
      return rule.reason;
    }
  }

  const lowerPath = normalizedPath.toLowerCase();
  if (/\.(?:tar\.gz|tar\.bz2|7z)$/i.test(lowerPath)) {
    return 'Writing archive files is blocked.';
  }

  const extension = path.extname(lowerPath);
  if (BLOCKED_BINARY_EXTENSIONS.has(extension)) {
    return `Writing ${extension} artifacts is blocked. Add binary/media assets manually.`;
  }

  return '';
}

export async function handleWarnLargeFiles(payload) {
  for (const filePath of getTouchedPaths(payload)) {
    const reason = getArtifactReason(filePath);
    if (reason) {
      return preToolDeny(reason);
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('warn-large-files', handleWarnLargeFiles);
}
