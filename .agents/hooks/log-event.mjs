#!/usr/bin/env node

import { isDirectEntrypoint, runHook } from './lib/core.mjs';

export async function handleLogEvent() {
  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('log-event', handleLogEvent);
}
