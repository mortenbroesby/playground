#!/usr/bin/env node

import {
  getProjectRoot,
  getTouchedPaths,
  isDirectEntrypoint,
  isPathInsideProject,
  loadAgentSettings,
  normalizeToolPath,
  preToolDeny,
  runHook,
} from './lib/core.mjs';
import {
  getMatchingPathRule,
  getPathBasename,
  isPathAllowlisted,
  matchesAnyPattern,
} from './lib/path-rules.mjs';

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
  {
    pattern: /(^|\/)\.agents\/hooks(\/|$)/i,
    reason: 'Editing agent hook scripts requires an explicit allowlist entry in .agents/settings.cjs under infrastructureEditAllowlist.',
    allowlistEligible: true,
  },
  {
    pattern: /(^|\/)\.claude\/settings(?:\.local)?\.json$/i,
    reason: 'Editing Claude hook settings requires an explicit allowlist entry in .agents/settings.cjs under infrastructureEditAllowlist.',
    allowlistEligible: true,
  },
];

// The infrastructure allowlist is the escape hatch for intentional hook or
// Claude-settings refactors. Keep the allowlist matching logic separate from
// the policy tables so the actual protected-path rules stay easy to scan.
function isInfrastructureEditAllowed(projectRoot, filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  const settings = loadAgentSettings(projectRoot);
  const allowlist = Array.isArray(settings.infrastructureEditAllowlist)
    ? settings.infrastructureEditAllowlist.map((entry) => normalizeToolPath(entry))
    : [];

  return isPathAllowlisted(normalizedPath, allowlist);
}

export function getProtectedPathReason(projectRoot, filePath) {
  const normalizedPath = normalizeToolPath(filePath);
  const basename = getPathBasename(normalizedPath);

  // Path rules are checked before basename rules so explicit directory and file
  // location protections win over broad filename-based blocking.
  const matchingRule = getMatchingPathRule(normalizedPath, PROTECTED_PATH_PATTERNS);
  if (matchingRule) {
    if (
      matchingRule.allowlistEligible &&
      isInfrastructureEditAllowed(projectRoot, normalizedPath)
    ) {
      return '';
    }

    return matchingRule.reason;
  }

  if (matchesAnyPattern(basename, PROTECTED_BASENAME_PATTERNS)) {
    return `Editing protected file ${basename} is blocked.`;
  }

  return '';
}

export async function handleProtectFiles(payload) {
  const projectRoot = getProjectRoot(payload);
  const touchedPaths = getTouchedPaths(payload);

  // Deny immediately on the first protected path. Hooks should return one clear
  // reason quickly instead of collecting every possible violation.
  for (const filePath of touchedPaths) {
    if (!isPathInsideProject(projectRoot, filePath)) {
      return preToolDeny('Editing files outside the project root is blocked.');
    }

    const reason = getProtectedPathReason(projectRoot, filePath);
    if (reason) {
      return preToolDeny(reason);
    }
  }

  return {};
}

if (isDirectEntrypoint(import.meta.url)) {
  runHook('protect-files', handleProtectFiles);
}
