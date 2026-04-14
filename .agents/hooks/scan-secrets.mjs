#!/usr/bin/env node

import {
  getWriteContentFragments,
  isDirectEntrypoint,
  isLikelySecret,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

export async function handleScanSecrets(payload) {
  const fragments = getWriteContentFragments(payload);
  if (!fragments.length) {
    return {};
  }

  if (fragments.some((fragment) => isLikelySecret(fragment))) {
    return preToolDeny('Possible secret detected in edited content. Redact it or move it to an ignored local environment file.');
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('scan-secrets', handleScanSecrets);
}
