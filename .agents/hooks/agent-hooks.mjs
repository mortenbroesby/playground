#!/usr/bin/env node

import { getEventName, getToolName, isDirectEntrypoint, runHook } from './lib/core.mjs';
import { handleAuditEditedFiles } from './audit-edited-files.mjs';
import { handleDangerousCommands } from './block-dangerous-commands.mjs';
import { handleNotify } from './notify.mjs';
import { handlePromptSecrets } from './check-prompt-secrets.mjs';
import { handleProtectFiles } from './protect-files.mjs';
import { handleScanSecrets } from './scan-secrets.mjs';
import { handleSessionStart } from './session-start.mjs';
import { handleWarnLargeFiles } from './warn-large-files.mjs';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);

export async function handleAgentHook(payload) {
  const eventName = getEventName(payload);
  const toolName = getToolName(payload);

  if (eventName === 'Notification' || eventName === 'notify' || eventName === 'notify-error') {
    return handleNotify(payload);
  }

  if (eventName === 'SessionStart') {
    return handleSessionStart(payload);
  }

  if (eventName === 'UserPromptSubmit') {
    return handlePromptSecrets(payload);
  }

  if (eventName === 'PreToolUse' && toolName === 'Bash') {
    return handleDangerousCommands(payload);
  }

  if (eventName === 'PreToolUse' && EDIT_TOOLS.has(toolName)) {
    for (const handler of [handleProtectFiles, handleWarnLargeFiles, handleScanSecrets]) {
      const result = await handler(payload);
      if (result.stdout || result.stderr || typeof result.exitCode === 'number') {
        return result;
      }
    }
  }

  if (eventName === 'PostToolUse' && EDIT_TOOLS.has(toolName)) {
    return handleAuditEditedFiles(payload);
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('agent-hooks-compat', handleAgentHook);
}
