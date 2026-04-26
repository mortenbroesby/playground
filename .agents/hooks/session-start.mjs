#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  ensureAiContextEngineObservability,
  ensureAiContextEngineWatch,
} from './lib/ai-context-engine.mjs';
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
  let watchStatus = null;
  let observabilityStatus = null;

  try {
    watchStatus = await ensureAiContextEngineWatch(cwd);
  } catch (error) {
    watchStatus = {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    observabilityStatus = await ensureAiContextEngineObservability(cwd);
  } catch (error) {
    observabilityStatus = {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const baseContext = [
    'Shared cross-agent hook policy is active for this session.',
    'Use ai-context-engine first for code exploration. See `.agents/rules/repo-workflow.md` for tool selection and `AGENT_HOOKS.md` for hook behavior.',
    'Avoid ad hoc grep/find/cat scans across code. Use direct `Read` only for exact edit context or non-code support files.',
    'Block destructive shell commands, force-pushes, piped shell downloads, writes outside the project root, secrets, and generated output.',
    `Current working directory: ${cwd}`,
    'See `AGENT_HOOKS.md` for the shared policy and runtime mapping.',
  ];

  if (dynamicContext) {
    baseContext.push(`Current git state: ${dynamicContext}`);
  }

  if (watchStatus?.status === 'started' || watchStatus?.status === 'already-running') {
    baseContext.push(
      `ai-context-engine watch: ${watchStatus.status === 'started' ? 'started' : 'already running'} (pid ${watchStatus.pid}).`,
    );
  } else if (watchStatus?.status === 'error') {
    baseContext.push(`ai-context-engine watch bootstrap failed: ${watchStatus.message}`);
  }

  if (
    observabilityStatus?.status === 'started'
    || observabilityStatus?.status === 'already-running'
  ) {
    baseContext.push(
      `ai-context-engine observability: ${observabilityStatus.status === 'started' ? 'started' : 'already running'} at ${observabilityStatus.url}.`,
    );
  } else if (observabilityStatus?.status === 'error') {
    baseContext.push(`ai-context-engine observability bootstrap failed: ${observabilityStatus.message}`);
  }

  return sessionContext(baseContext.join('\n'));
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('session-start', handleSessionStart);
}
