import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE_WRAPPER_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../tools/ai-context-engine/scripts/ai-context-engine.mjs',
);

export function spawnAiContextEngineCli(projectRoot, args, { detached = false } = {}) {
  return spawn(process.execPath, [ENGINE_WRAPPER_PATH, 'cli', ...args], {
    cwd: projectRoot,
    detached,
    stdio: detached ? 'ignore' : 'inherit',
  });
}
