import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const hostDir = path.resolve(scriptDir, '..');
const todoDistDir = path.resolve(hostDir, '../../packages/remotes/todo-app/dist');
const remoteTargetDir = path.resolve(hostDir, 'public/remotes/todo-app');

await rm(remoteTargetDir, { recursive: true, force: true });
await mkdir(remoteTargetDir, { recursive: true });
await cp(todoDistDir, remoteTargetDir, { recursive: true });

console.log(`Synced todo-app remote to ${path.relative(hostDir, remoteTargetDir)}`);
