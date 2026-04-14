#!/usr/bin/env node

import path from 'node:path';
import {
  DESKTOP_NOTIFY_TITLE,
  getProjectRoot,
  getPromptText,
  isDirectEntrypoint,
  maybeNotifyDesktop,
  runHook,
} from './lib/core.mjs';

export async function handleNotify(payload) {
  const cwd = getProjectRoot(payload);
  const subtitle = cwd ? path.basename(cwd) || cwd : 'session';
  const body = getPromptText(payload) || 'Agent turn complete';

  await maybeNotifyDesktop(DESKTOP_NOTIFY_TITLE, subtitle, body.slice(0, 140));
  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('notify', handleNotify);
}
