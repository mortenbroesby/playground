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

  const lastCommit = runGit(['log', '--oneline', '-1'], cwd);
  if (lastCommit) {
    parts.push(`Last commit: ${lastCommit}`);
  }

  const porcelain = runGit(['status', '--porcelain'], cwd);
  const changeCount = porcelain ? porcelain.split(/\r?\n/).filter(Boolean).length : 0;
  if (changeCount > 0) {
    parts.push(`Uncommitted changes: ${changeCount} files`);
  }

  const staged = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd,
    stdio: 'ignore',
  });
  if (staged.status === 1) {
    parts.push('Staged: yes');
  }

  const stashList = runGit(['stash', 'list'], cwd);
  const stashCount = stashList ? stashList.split(/\r?\n/).filter(Boolean).length : 0;
  if (stashCount > 0) {
    parts.push(`Stashes: ${stashCount}`);
  }

  return parts.join(' | ');
}

export async function handleSessionStart(payload) {
  const cwd = getProjectRoot(payload);
  const dynamicContext = buildDynamicGitContext(cwd);
  const baseContext = [
    'Shared cross-agent hook policy is active for this session.',
    'Use `rg` and jCodemunch for discovery, avoid ad hoc grep/find scans, and keep edits scoped.',
    'Block destructive shell commands, force-pushes, piped shell downloads, writes outside the project root, secrets, and generated output.',
    `Current working directory: ${cwd}`,
    'See `AGENT_HOOKS.md` for the shared policy and runtime mapping.',
  ];

  if (dynamicContext) {
    baseContext.push(`Current git state: ${dynamicContext}`);
  }

  return sessionContext(baseContext.join('\n'));
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('session-start', handleSessionStart);
}
