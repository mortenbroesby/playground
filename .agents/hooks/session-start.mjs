#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ensureAiContextEngineWatch } from './lib/ai-context-engine.mjs';
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

function getInstallReadiness(projectRoot) {
  const rootNodeModules = path.join(projectRoot, 'node_modules');
  const astrographBin = path.join(projectRoot, 'node_modules', '.bin', 'astrograph');
  const obsidianNodeModules = path.join(projectRoot, 'tools', 'obsidian-memory', 'node_modules');

  const missing = [];

  if (!existsSync(rootNodeModules)) {
    missing.push('node_modules/');
  }

  if (!existsSync(astrographBin)) {
    missing.push('node_modules/.bin/astrograph');
  }

  if (!existsSync(obsidianNodeModules)) {
    missing.push('tools/obsidian-memory/node_modules/');
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}

export async function handleSessionStart(payload) {
  const cwd = getProjectRoot(payload);
  const dynamicContext = buildDynamicGitContext(cwd);
  const installReadiness = getInstallReadiness(cwd);
  let watchStatus = null;

  if (installReadiness.ready) {
    try {
      watchStatus = await ensureAiContextEngineWatch(cwd);
    } catch (error) {
      watchStatus = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
    }

  }

  const baseContext = [
    'Shared hook policy is active.',
    'Use indexed repo navigation first and use `obsidian-memory` for repo history, architecture, and decisions.',
  ];

  if (dynamicContext) {
    baseContext.push(`Git: ${dynamicContext}`);
  }

  if (!installReadiness.ready) {
    baseContext.push(
      `Run \`pnpm install\` before relying on repo-local tooling. Missing: ${installReadiness.missing.join(', ')}`,
    );
  }

  if (watchStatus?.status === 'error') {
    baseContext.push(`Astrograph watch bootstrap failed: ${watchStatus.message}`);
  }

  return sessionContext(baseContext.join('\n'));
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('session-start', handleSessionStart);
}
