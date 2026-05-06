import { spawnSync } from 'node:child_process';

// Hook code only needs lightweight git reads for policy and status context.
// Keep the wrapper intentionally narrow: run a git command, return trimmed
// stdout on success, and collapse all failures to an empty string.
export function runGit(args, cwd = process.cwd()) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return result.status === 0 ? result.stdout.trim() : '';
}
