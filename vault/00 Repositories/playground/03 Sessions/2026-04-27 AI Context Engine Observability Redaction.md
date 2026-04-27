# 2026-04-27 AI Context Engine Observability Redaction

- Scope: Phase 6 privacy follow-up from `.specs/ai-engine-refactor.md`
- Goal: make observability payloads privacy-safe by default without breaking
  local debugging

## Landed

- Added `observability.redactSourceText` repo config with a default of `true`
- Redacted source-like event payload fields before persisting `events.jsonl`
- Always scrubbed obvious secret-shaped tokens even when source-text redaction is
  explicitly disabled
- Added focused event-sink coverage for default redaction and local opt-out

## Notes

- This slice only changes observability event persistence
- It does not yet add separate doctor warnings for secret-like source content
