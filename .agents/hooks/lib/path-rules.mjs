import path from 'node:path';

import { normalizeToolPath } from './core.mjs';

// These helpers keep the rule-walking mechanics shared while letting each hook
// keep ownership of its own policy tables. The goal is less repetition across
// hooks, not one global registry of every path rule in the repo.
export function findMatchingRule(value, rules) {
  return rules.find((rule) => rule.pattern.test(value)) || null;
}

export function matchesAnyPattern(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

// Allowlist entries support both exact paths and prefix-style `/**` entries so
// infrastructure edits can be opened up surgically during intentional refactor
// work without weakening the default protections everywhere else.
export function isPathAllowlisted(normalizedPath, allowlist) {
  return allowlist.some((entry) => {
    if (entry.endsWith('/**')) {
      const prefix = entry.slice(0, -3);
      return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
    }

    return normalizedPath === entry;
  });
}

export function getPathBasename(filePath) {
  return path.basename(normalizeToolPath(filePath));
}

// Hooks often receive mixed path shapes from different tools. Normalize first
// so the policy regexes only need to reason about one slash style.
export function getMatchingPathRule(filePath, rules) {
  return findMatchingRule(normalizeToolPath(filePath), rules);
}
