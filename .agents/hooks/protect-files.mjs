#!/usr/bin/env node

import path from 'node:path';
import {
  getProjectRoot,
  getTouchedPaths,
  isDirectEntrypoint,
  isPathInsideProject,
  normalizeToolPath,
  preToolDeny,
  runHook,
} from './lib/core.mjs';

const PROTECTED_BASENAME_PATTERNS = [
  /^\.env(?:\.[^/]+)?$/i,
  /^\.npmrc$/i,
  /^\.pypirc$/i,
  /^credentials\.json$/i,
  /^id_(?:rsa|ed25519)(?:\.pub)?$/i,
  /^pnpm-lock\.yaml$/i,
  /^package-lock\.json$/i,
  /^yarn\.lock$/i,
  /^.*\.(?:pem|key|crt|p12|pfx)$/i,
  /^.*\.gen\.ts$/i,
  /^.*\.generated\..*$/i,
  /^.*\.min\.(?:js|css)$/i,
];

const PROTECTED_PATH_PATTERNS = [
  { pattern: /(^|\/)\.git(\/|$)/i, reason: 'Editing files inside .git/ is blocked.' },
  { pattern: /(^|\/)\.ssh(\/|$)/i, reason: 'Editing files inside .ssh/ is blocked.' },
  { pattern: /(^|\/)secrets(\/|$)/i, reason: 'Editing files inside secrets/ is blocked.' },
  { pattern: /(^|\/)(?:dist|build|\.next|\.turbo|coverage)(\/|$)/i, reason: 'Editing generated output directories is blocked.' },
  { pattern: /(^|\/)\.agents\/hooks(\/|$)/i, reason: 'Editing agent hook scripts through hooked tools is blocked. Review hook changes manually.' },
  { pattern: /(^|\/)\.claude\/settings(?:\.local)?\.json$/i, reason: 'Editing Claude hook settings through hooked tools is blocked. Review hook changes manually.' },
];

export function getProtectedPathReason(filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  const basename = path.basename(normalizedPath);

  for (const rule of PROTECTED_PATH_PATTERNS) {
    if (rule.pattern.test(normalizedPath)) {
      return rule.reason;
    }
  }

  if (PROTECTED_BASENAME_PATTERNS.some((pattern) => pattern.test(basename))) {
    return `Editing protected file ${basename} is blocked.`;
  }

  return '';
}

export async function handleProtectFiles(payload) {
  const projectRoot = getProjectRoot(payload);
  const touchedPaths = getTouchedPaths(payload);

  for (const filePath of touchedPaths) {
    if (!isPathInsideProject(projectRoot, filePath)) {
      return preToolDeny('Editing files outside the project root is blocked.');
    }

    const reason = getProtectedPathReason(filePath);
    if (reason) {
      return preToolDeny(reason);
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('protect-files', handleProtectFiles);
}
