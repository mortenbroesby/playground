# 2026-04-27 AI Context Engine Discovery Limits Enforcement

- Scope: follow-up to the `limits` config slice from `.specs/performance-deps.md`
- Goal: enforce the remaining discovery-related limits instead of leaving them
  config-only

## Landed

- `limits.maxFilesDiscovered` now fails supported-file discovery when the
  filtered set exceeds the configured ceiling
- `limits.maxFileBytes` now excludes oversized files from:
  - source discovery
  - filesystem snapshots
  - watch subtree rescans
  - indexed folder refresh
- explicit single-file refresh paths now treat oversized files as non-indexable
  and remove any previously indexed row instead of failing the refresh loop

## Verification

- added scanner tests for:
  - oversized-file exclusion
  - max-file-count failure
- added behavior coverage proving repo-config `maxFileBytes` keeps oversized
  source files out of the index
