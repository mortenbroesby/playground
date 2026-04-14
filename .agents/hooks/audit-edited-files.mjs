#!/usr/bin/env node

import { getTouchedPaths, isDirectEntrypoint, makeJsonOutput, runHook } from './lib/core.mjs';
import { getProtectedPathReason } from './protect-files.mjs';

export async function handleAuditEditedFiles(payload) {
  const protectedPaths = getTouchedPaths(payload).filter((filePath) => getProtectedPathReason(filePath));

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
