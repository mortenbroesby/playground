import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

function resolveAiContextEngineInvocation(projectRoot) {
  const localBin = path.join(projectRoot, 'node_modules', '.bin', 'ai-context-engine');

  if (existsSync(localBin)) {
    return {
      command: localBin,
      prefixArgs: [],
    };
  }

  return {
    command: 'pnpm',
    prefixArgs: ['exec', 'ai-context-engine'],
  };
}

export function spawnAiContextEngineCli(projectRoot, args, { detached = false } = {}) {
  const invocation = resolveAiContextEngineInvocation(projectRoot);

  return spawn(invocation.command, [...invocation.prefixArgs, 'cli', ...args], {
    cwd: projectRoot,
    detached,
    stdio: detached ? 'ignore' : 'inherit',
  });
}

function aiContextEnginePaths(projectRoot) {
  const storageDir = path.join(projectRoot, '.ai-context-engine');

  return {
    storageDir,
    watchPidPath: path.join(storageDir, 'watch.pid'),
    watchLogPath: path.join(storageDir, 'watch.log'),
  };
}

async function readWatchPid(watchPidPath) {
  try {
    const value = (await fs.readFile(watchPidPath, 'utf8')).trim();
    if (!value) {
      return null;
    }

    const pid = Number(value);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function waitForWatchPid(watchPidPath, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const pid = await readWatchPid(watchPidPath);
    if (pid) {
      return pid;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return null;
}

function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'EPERM') {
      return true;
    }
    return false;
  }
}

export async function ensureAiContextEngineWatch(projectRoot, { debounceMs = 150 } = {}) {
  const { storageDir, watchPidPath, watchLogPath } = aiContextEnginePaths(projectRoot);
  await fs.mkdir(storageDir, { recursive: true });

  const existingPid = await readWatchPid(watchPidPath);
  if (existingPid && isPidRunning(existingPid)) {
    return {
      status: 'already-running',
      pid: existingPid,
      watchPidPath,
      watchLogPath,
    };
  }

  const stdoutFd = openSync(watchLogPath, 'a');
  const stderrFd = openSync(watchLogPath, 'a');
  const invocation = resolveAiContextEngineInvocation(projectRoot);

  try {
    const child = spawn(invocation.command, [
      ...invocation.prefixArgs,
      'cli',
      'watch',
      '--repo',
      projectRoot,
      '--debounce-ms',
      String(debounceMs),
      '--pid-file',
      watchPidPath,
    ], {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', stdoutFd, stderrFd],
    });

    child.unref();

    if (!child.pid) {
      throw new Error('ai-context-engine watch process did not report a pid');
    }

    const actualPid = await waitForWatchPid(watchPidPath);

    return {
      status: 'started',
      pid: actualPid ?? child.pid,
      watchPidPath,
      watchLogPath,
    };
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
  }
}
