import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const REMOTE_ENTRY_URL = 'http://127.0.0.1:3101/remoteEntry.js';
const DEV_SERVER_START_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 500;

function startTodoAppServer() {
  const child = spawn('pnpm', ['dev'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    stdio: 'pipe',
    detached: process.platform !== 'win32',
  });

  let output = '';

  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  return { child, getOutput: () => output };
}

async function waitForRemoteEntry() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < DEV_SERVER_START_TIMEOUT_MS) {
    try {
      const response = await fetch(REMOTE_ENTRY_URL);
      if (response.ok) {
        return response;
      }
    } catch {}

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for ${REMOTE_ENTRY_URL}`);
}

test('todo-app exposes remoteEntry.js on port 3101', async () => {
  const devServer = startTodoAppServer();
  const exitPromise = once(devServer.child, 'exit').then(([code, signal]) => {
    throw new Error(
      `todo-app dev server exited before ${REMOTE_ENTRY_URL} was reachable (code: ${code}, signal: ${signal})\n${devServer.getOutput()}`,
    );
  });

  try {
    const response = await Promise.race([waitForRemoteEntry(), exitPromise]);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.notEqual(body.trim().length, 0);
  } finally {
    try {
      if (process.platform === 'win32') {
        devServer.child.kill('SIGTERM');
      } else if (devServer.child.pid) {
        process.kill(-devServer.child.pid, 'SIGTERM');
      }
    } catch (error) {
      if (error?.code !== 'ESRCH') {
        throw error;
      }
    }

    await once(devServer.child, 'exit').catch(() => {});
  }
});
