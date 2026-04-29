#!/usr/bin/env node

import {
  getProjectRoot,
  getTouchedPaths,
  isDirectEntrypoint,
  makeJsonOutput,
  runHook,
} from './lib/core.mjs';
import { getProtectedPathReason } from './protect-files.mjs';

export async function handleAuditEditedFiles(payload) {
  const projectRoot = getProjectRoot(payload);
  const protectedPaths = getTouchedPaths(payload).filter((filePath) => getProtectedPathReason(projectRoot, filePath));

  if (!protectedPaths.length) {
    return {};
  }

  return {
    stdout: makeJsonOutput({
      decision: 'block',
      reason: 'A protected file was modified. Review the change before continuing.',
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Protected path touched: ${protectedPaths.join(', ')}`,
      },
    }),
  };
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('audit-edited-files', handleAuditEditedFiles);
}
