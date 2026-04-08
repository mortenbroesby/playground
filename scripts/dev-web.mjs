import { spawn } from 'node:child_process';

const HOST_URL = 'http://127.0.0.1:3000/';
const STARTUP_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

function getOpenCommand(url) {
  switch (process.platform) {
    case 'darwin':
      return ['open', [url]];
    case 'win32':
      return ['cmd', ['/c', 'start', '', url]];
    default:
      return ['xdg-open', [url]];
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable(url) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

async function stackIsReady() {
  return isReachable(HOST_URL);
}

function openBrowser(url) {
  const [command, args] = getOpenCommand(url);
  const child = spawn(command, args, {
    stdio: 'ignore',
    detached: true,
  });

  child.unref();
}

async function waitForReadyOrExit(child) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    if (await stackIsReady()) {
      return 'ready';
    }

    if (child.exitCode !== null) {
      return 'exited';
    }

    await wait(POLL_INTERVAL_MS);
  }

  return 'timeout';
}

if (await stackIsReady()) {
  console.log(`Web stack already running, opening ${HOST_URL}`);
  openBrowser(HOST_URL);
  process.exit(0);
}

const devProcess = spawn(
  'pnpm',
  ['turbo', 'dev', '--filter=@playground/host'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

let browserOpened = false;

const forwardSignal = (signal) => {
  if (devProcess.exitCode === null) {
    devProcess.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

const readiness = await waitForReadyOrExit(devProcess);

if (readiness === 'ready' && !browserOpened) {
  browserOpened = true;
  console.log(`Opening ${HOST_URL}`);
  openBrowser(HOST_URL);
} else if (readiness === 'timeout') {
  console.error(`Timed out waiting for ${HOST_URL}`);
  forwardSignal('SIGTERM');
}

const exitCode = await new Promise((resolve) => {
  devProcess.on('exit', (code, signal) => {
    if (signal) {
      resolve(1);
      return;
    }

    resolve(code ?? 0);
  });
});

process.exit(exitCode);
