---
type: repo-task
repo: playground
id: evaluate-tsup-for-ai-context-engine-packaging
priority: P2
status: Backlog
ai_appetite: 20
source: "follow-up from ai-context-engine phase 2 closeout"
---

# Evaluate tsup for ai-context-engine packaging

## Why

The AI context engine and benchmark harness currently run directly from
TypeScript via Node strip-types mode. That is simple and works well for private
workspace use, but it does not produce a distributable `dist/` contract if we
later want to publish, bundle, or harden runtime startup behavior.

## Outcome

A clear decision on whether `@playground/ai-context-engine` and
`@playground/ai-context-engine` should stay on native TypeScript
execution or move to `tsup` or an equivalent packaging step.

## Details

### Scope

- Compare the current native TypeScript runtime against `tsup` for:
  - local developer ergonomics
  - CLI and MCP startup behavior
  - ESM packaging correctness
  - test and workspace compatibility
  - dist artifact expectations
- Only implement the migration if there is a concrete need for published or
  external-consumer artifacts

### Acceptance criteria

- Decision is documented with concrete tradeoffs
- If migration is justified, package scripts and export paths are updated
- If migration is not justified, the current native TypeScript approach remains
  the documented default

### Non-goals

- Bundling every workspace package in the monorepo
- Introducing generated output without an explicit distribution need
