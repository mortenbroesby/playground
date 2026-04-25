#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  firstNonEmpty,
  getProjectRoot,
  getToolInput,
  getToolName,
  isDirectEntrypoint,
  normalizeToolPath,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

const CODE_PATH_PATTERNS = [
  /(^|\/)(apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github)(\/|$)/i,
  /\.(?:c|cc|cpp|cs|css|go|h|hpp|html|java|js|json|jsx|kt|mjs|php|py|rb|rs|scss|sh|sql|swift|toml|ts|tsx|vue|xml|yaml|yml)$/i,
];

const SAFE_BASH_PATTERNS = [
  /\b(?:git|pnpm|node|npm|npx|yarn|bun|cargo|go|pytest|vitest|jest|docker|kubectl|ai-context-engine)\b/i,
  /\brg\b[^|]*(?:README|AGENTS|CLAUDE|docs\/|vault\/)/i,
];

const EXPLORATION_BASH_PATTERNS = [
  /\b(?:rg|grep|find|fd|cat|head|tail|less|more)\b/i,
  /\bsed\s+-n\b/i,
];

const LARGE_READ_BYTES = 6_000;

function isCodeLikePath(filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  return CODE_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function buildGuardReason() {
  return [
    'Use ai-context-engine for code exploration.',
    'Start with `query_code`, then prefer `get_file_outline`, `get_file_tree`, `get_repo_outline`, and `diagnostics` before broad file reads.',
    'Use direct file reads only for exact edit context or non-code support files.',
  ].join(' ');
}

function shouldBlockBash(command) {
  if (!command) {
    return false;
  }

  if (SAFE_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
    return false;
  }

  if (!EXPLORATION_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
    return false;
  }

  return /(?:apps|packages|tools|scripts|\.agents|\.codex|\.claude|\.github|src|tests|api|components|lib|routes)/i.test(command)
    || /\.(?:c|cc|cpp|cs|css|go|h|hpp|html|java|js|json|jsx|kt|mjs|php|py|rb|rs|scss|sh|sql|swift|toml|ts|tsx|vue|xml|yaml|yml)\b/i.test(command);
}

function shouldBlockGlob(toolInput) {
  const pattern = firstNonEmpty(toolInput?.pattern, toolInput?.glob, toolInput?.path, '');
  return isCodeLikePath(pattern);
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

  if (toolName === 'Bash') {
    const command = firstNonEmpty(toolInput?.command, '');
    return shouldBlockBash(command) ? preToolDeny(buildGuardReason()) : {};
  }

  if (toolName === 'Glob') {
    return shouldBlockGlob(toolInput) ? preToolDeny(buildGuardReason()) : {};
  }

  if (toolName === 'Grep') {
    return shouldBlockGrep(toolInput) ? preToolDeny(buildGuardReason()) : {};
  }

  if (toolName === 'Read') {
    const projectRoot = getProjectRoot(payload);
    if (shouldWarnOnRead(projectRoot, toolInput)) {
      return {
        stderr: 'Large code read detected. Prefer ai-context-engine first: `query_code`, `get_file_outline`, `get_file_tree`, `get_repo_outline`, and `diagnostics`. Targeted `Read` with `offset`/`limit` is fine.\n',
      };
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('code-navigation-guard', handleCodeNavigationGuard);
}
