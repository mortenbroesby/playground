#!/usr/bin/env node

import path from 'node:path';
import {
  getTouchedPaths,
  isDirectEntrypoint,
  preToolDeny,
  runHook,
} from './lib/core.mjs';
import { getMatchingPathRule } from './lib/path-rules.mjs';

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

// Despite the filename, this hook is an artifact-write guard rather than a
// size-only warning. It blocks edits into generated dependency trees and common
// binary/archive targets where agent writes are rarely intentional.
function getArtifactReason(filePath) {
  const matchingRule = getMatchingPathRule(filePath, BLOCKED_DIRECTORY_PATTERNS);
  if (matchingRule) {
    return matchingRule.reason;
  }

  const lowerPath = String(filePath).toLowerCase();
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
