#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  getProjectRoot,
  isDirectEntrypoint,
  runHook,
  sessionContext,
} from './lib/core.mjs';

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return result.status === 0 ? result.stdout.trim() : '';
}

function buildDynamicGitContext(cwd) {
  const parts = [];
  const branch = runGit(['branch', '--show-current'], cwd);

  if (branch) {
    parts.push(`Branch: ${branch}`);
  } else if (runGit(['rev-parse', '--git-dir'], cwd)) {
    const shortSha = runGit(['rev-parse', '--short', 'HEAD'], cwd);
    if (shortSha) {
      parts.push(`HEAD: detached at ${shortSha}`);
    }
  }

  const porcelain = runGit(['status', '--porcelain'], cwd);
  const changeCount = porcelain ? porcelain.split(/\r?\n/).filter(Boolean).length : 0;
  if (changeCount > 0) {
    parts.push(`Uncommitted changes: ${changeCount} files`);
  }

  return parts.join(' | ');
}

export async function handleSessionStart(payload) {
  const cwd = getProjectRoot(payload);
  const dynamicContext = buildDynamicGitContext(cwd);

  const baseContext = [
    'Shared hook policy is active.',
    'Use indexed repo navigation first and use `obsidian-memory` for repo history, architecture, and decisions.',
  ];

  if (dynamicContext) {
    baseContext.push(`Git: ${dynamicContext}`);
  }

  return sessionContext(baseContext.join('\n'));
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('session-start', handleSessionStart);
}
