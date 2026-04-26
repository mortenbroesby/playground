#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  firstNonEmpty,
  getProjectRoot,
  getToolInput,
  isDirectEntrypoint,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

const DANGEROUS_COMMAND_PATTERNS = [
  {
    pattern: /\bsudo\b/i,
    reason: 'sudo is blocked inside agent hooks.',
  },
  {
    pattern: /\b(?:curl|wget)\b.*\|\s*(?:sh|bash|zsh|sudo)\b/i,
    reason: 'Piping downloaded content directly to a shell is blocked. Download, inspect, then execute manually.',
  },
  {
    pattern: /\bchmod\s+(?:-R\s+)?777\b/i,
    reason: 'chmod 777 is blocked. Use more restrictive permissions.',
  },
  {
    pattern: /\b(?:mkfs|dd\s+if=|>\s*\/dev\/)/i,
    reason: 'Destructive disk operations are blocked.',
  },
  {
    pattern: /\bgit\s+reset\s+--hard\b/i,
    reason: 'git reset --hard is blocked because it discards uncommitted work.',
  },
  {
    pattern: /\bgit\s+clean\s+-[a-zA-Z]*f\b/i,
    reason: 'git clean -f is blocked because it permanently deletes untracked files. Review with git clean -n first.',
  },
  {
    pattern: /\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b/i,
    reason: 'DROP TABLE/DATABASE/SCHEMA is blocked. Run destructive database changes manually if intended.',
  },
  {
    pattern: /\bDELETE\s+FROM\s+[a-zA-Z_][\w.]*\s*(?:;|$)/i,
    reason: 'DELETE FROM without a WHERE clause is blocked.',
  },
  {
    pattern: /\bTRUNCATE\s+TABLE\b/i,
    reason: 'TRUNCATE TABLE is blocked. Run destructive database changes manually if intended.',
  },
  {
    pattern: /\b(?:npm|yarn|pnpm|bun)\s+publish\b/i,
    reason: 'Package publishing is blocked from agent hooks. Use CI or run it manually.',
  },
  {
    pattern: /\b(?:cargo\s+publish|gem\s+push|twine\s+upload)\b/i,
    reason: 'Package publishing is blocked from agent hooks. Use CI or run it manually.',
  },
];

function loadAgentSettings(projectRoot) {
  const settingsPath = path.join(projectRoot, '.agents', 'settings.json');
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
}

function allowsDirectMainPush(command, projectRoot) {
  if (/\bCODEX_ALLOW_DIRECT_MAIN_PUSH=1\b/.test(command)) {
    return true;
  }

  return loadAgentSettings(projectRoot).allowDirectMainPush === true;
}

function getCurrentBranch() {
  const result = spawnSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return result.status === 0 ? result.stdout.trim() : '';
}

export function getDangerousCommandReason(command, projectRoot = process.cwd()) {
  if (!command) {
    return '';
  }

  if (/(^|[;&|()]\s*)git\s+push\b/i.test(command)) {
    if (
      /\bgit\s+push\b.*(?:origin\s+|:)(?:main|master)\b/i.test(command) &&
      !allowsDirectMainPush(command, projectRoot)
    ) {
      return 'Pushing directly to main/master is blocked. Use a feature branch and create a PR.';
    }

    if (/\bgit\s+push\b.*(?:-[a-zA-Z]*f\b|--force(?:\s|$))/i.test(command) && !/\b--force-with-lease\b/i.test(command)) {
      return 'Force pushes are blocked. Use --force-with-lease only after manual review.';
    }

    if (/\bgit\s+push\s*(?:$|[;&|])/i.test(command)) {
      const branch = getCurrentBranch();
      if (
        (branch === 'main' || branch === 'master') &&
        !allowsDirectMainPush(command, projectRoot)
      ) {
        return `Bare git push is blocked on ${branch}. Use a feature branch and create a PR.`;
      }
    }
  }

  if (/\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\s+(?:\/|~|\$HOME|\.\.\/\.\.)/i.test(command)) {
    return 'Recursive force delete targeting root, home, or parent paths is blocked.';
  }

  if (/\brm\s+-[a-zA-Z]*r.*\s+(?:\/\s|\/\*|\/$|~\/?\*?(?:\s|$))/i.test(command)) {
    return 'Recursive delete targeting root or home is blocked.';
  }

  for (const rule of DANGEROUS_COMMAND_PATTERNS) {
    if (rule.pattern.test(command)) {
      return rule.reason;
    }
  }

  return '';
}

export async function handleDangerousCommands(payload) {
  const command = firstNonEmpty(getToolInput(payload)?.command, '');
  const projectRoot = getProjectRoot(payload);
  const reason = getDangerousCommandReason(command, projectRoot);
  return reason ? preToolDeny(reason) : {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('block-dangerous-commands', handleDangerousCommands);
}
