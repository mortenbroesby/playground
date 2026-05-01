#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  getProjectRoot,
  getToolInput,
  isDirectEntrypoint,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

const SKIP_AGENT_MEMORY_CHECK_ENV = 'SKIP_AGENT_MEMORY_CHECK';

function isGitCommitCommand(command) {
  if (!command) {
    return false;
  }

  return /(?:^|\s|;|&|\||\()(?:\w+=\S+\s+)*git\s+commit\b/.test(command);
}

function runKnowledgeCheck(projectRoot) {
  const result = spawnSync(process.execPath, ['scripts/check-knowledge-reminder.mjs'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status === 0) {
    return null;
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (!output) {
    return 'Knowledge check failed for this commit. Run `pnpm knowledge:check` to review.';
  }

  return `Knowledge check failed:\n${output}`;
}

export async function handleKnowledgeCommitCheck(payload) {
  const command = String(getToolInput(payload)?.command || '');
  if (!isGitCommitCommand(command)) {
    return {};
  }

  if (process.env[SKIP_AGENT_MEMORY_CHECK_ENV] === '1') {
    return {};
  }

  const projectRoot = getProjectRoot(payload);
  const reason = runKnowledgeCheck(projectRoot);
  return reason ? preToolDeny(reason) : {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('knowledge-commit-check', handleKnowledgeCommitCheck);
}
