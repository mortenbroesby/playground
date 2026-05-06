#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  firstNonEmpty,
  getProjectRoot,
  getToolInput,
  getToolName,
  isDirectEntrypoint,
  preToolDeny,
  runHook,
} from './lib/core.mjs';
import { getAstrographBlockedExplorationReason } from './lib/astrograph-code-navigation.mjs';
import { matchesAnyPattern } from './lib/path-rules.mjs';

const CODE_PATH_PATTERNS = [
  /(^|\/)(apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github)(\/|$)/i,
  /\.(?:c|cc|cpp|cs|css|go|h|hpp|html|java|js|json|jsx|kt|mjs|php|py|rb|rs|scss|sh|sql|swift|toml|ts|tsx|vue|xml|yaml|yml)$/i,
];

const SAFE_BASH_PATTERNS = [
  /\b(?:git|pnpm|node|npm|npx|yarn|bun|cargo|go|pytest|vitest|jest|docker|kubectl)\b/i,
  /\brg\b[^|]*(?:README|AGENTS|CLAUDE|docs\/|vault\/)/i,
];

const EXPLORATION_BASH_PATTERNS = [
  /\b(?:rg|grep|find|fd|cat|head|tail|less|more)\b/i,
  /\bsed\s+-n\b/i,
];

const LARGE_READ_BYTES = 6_000;

// Code-like detection deliberately mixes top-level repo areas and file
// extensions. The guard only needs a cheap heuristic for "this probably belongs
// to indexed code navigation", not a perfect classifier.
function isCodeLikePath(filePath) {
  return matchesAnyPattern(String(filePath ?? '').replaceAll(path.sep, '/'), CODE_PATH_PATTERNS);
}

// The bash guard is intentionally asymmetric: allow obvious safe operational
// commands, then block shell-based exploration only when it looks like code
// discovery that Astrograph should handle instead.
function shouldBlockBash(command) {
  if (!command) {
    return false;
  }

  if (matchesAnyPattern(command, SAFE_BASH_PATTERNS)) {
    return false;
  }

  if (!matchesAnyPattern(command, EXPLORATION_BASH_PATTERNS)) {
    return false;
  }

  return /(?:apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github|src|tests|api|components|lib|routes)/i.test(command)
    || /\.(?:c|cc|cpp|cs|css|go|h|hpp|html|java|js|json|jsx|kt|mjs|php|py|rb|rs|scss|sh|sql|swift|toml|ts|tsx|vue|xml|yaml|yml)\b/i.test(command);
}

function shouldBlockGlob(toolInput) {
  const pattern = firstNonEmpty(toolInput?.pattern, toolInput?.glob, toolInput?.path, '');
  return pattern ? isCodeLikePath(pattern) : false;
}

function shouldBlockGrep(toolInput) {
  const target = firstNonEmpty(toolInput?.include, toolInput?.path, toolInput?.file_path, toolInput?.pattern, '');
  return !target || isCodeLikePath(target);
}

function shouldWarnOnRead(projectRoot, toolInput) {
  const filePath = firstNonEmpty(toolInput?.file_path, toolInput?.path, '');
  if (!filePath || !isCodeLikePath(filePath)) {
    return false;
  }

  if (toolInput?.offset !== undefined || toolInput?.limit !== undefined) {
    return false;
  }

  const absolutePath = path.resolve(projectRoot, filePath);
  try {
    const stat = fs.statSync(absolutePath);
    return stat.isFile() && stat.size >= LARGE_READ_BYTES;
  } catch {
    return false;
  }
}

export async function handleCodeNavigationGuard(payload) {
  const toolName = getToolName(payload);
  const toolInput = getToolInput(payload);

  // Keep the top-level handler as a narrow dispatcher: identify the tool,
  // evaluate one focused rule set, and return the corresponding denial or
  // warning without mixing the policies together.
  if (toolName === 'Bash') {
    const command = firstNonEmpty(toolInput?.command, '');
    return shouldBlockBash(command)
      ? preToolDeny(getAstrographBlockedExplorationReason('bash-search'))
      : {};
  }

  if (toolName === 'Glob') {
    return shouldBlockGlob(toolInput)
      ? preToolDeny(getAstrographBlockedExplorationReason('glob'))
      : {};
  }

  if (toolName === 'Grep') {
    return shouldBlockGrep(toolInput)
      ? preToolDeny(getAstrographBlockedExplorationReason('grep'))
      : {};
  }

  if (toolName === 'Read') {
    const projectRoot = getProjectRoot(payload);
    if (shouldWarnOnRead(projectRoot, toolInput)) {
      return {
        stderr: `${getAstrographBlockedExplorationReason('large-read')}\n`,
      };
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('code-navigation-guard', handleCodeNavigationGuard);
}
