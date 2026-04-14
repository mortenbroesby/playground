#!/usr/bin/env node

import {
  getPromptText,
  isDirectEntrypoint,
  isLikelySecret,
  runHook,
  userPromptBlock,
} from './lib/core.mjs';

export async function handlePromptSecrets(payload) {
  if (!isLikelySecret(getPromptText(payload))) {
    return {};
  }

  return userPromptBlock('Prompt appears to contain a secret or credential. Redact it before continuing.');
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('check-prompt-secrets', handlePromptSecrets);
}
