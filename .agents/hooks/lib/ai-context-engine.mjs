import { spawn } from 'node:child_process';

export function spawnAiContextEngineCli(projectRoot, args, { detached = false } = {}) {
  return spawn('pnpm', ['exec', 'ai-context-engine', 'cli', ...args], {
    cwd: projectRoot,
    detached,
    stdio: detached ? 'ignore' : 'inherit',
  });
}
