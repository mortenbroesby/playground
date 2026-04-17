---
type: repo-session
repo: playground
date: 2026-04-17
---

# Stryker smoke adoption for `ai-context-engine`

## Outcome

A first StrykerJS setup now exists for `packages/ai-context-engine` with two
profiles and an explicit opt-in gate:

- `test:mutation`: informational gate only
- `test:mutation:full`: informational gate only
- `mutation:smoke`: fast smoke profile
- `mutation:full`: broader boundary profile

The smoke profile was carved down aggressively to keep it usable in the normal
loop. It now runs against two dedicated mutation-smoke tests only:

- `tests/mutation-smoke.cli.test.ts`
- `tests/mutation-smoke.watch.test.ts`

## Current runtime shape

- direct Vitest run for the two smoke tests: about 3.2s
- Stryker smoke dry run: about 6s
- full carved smoke run: about 49s

This is materially better than the earlier attempts:

- initial broad profile: about 1 hour estimated
- first narrowed profile: about 11 minutes estimated
- later smoke attempt before dedicated tests: about 4 minutes estimated

## Current smoke mutate scope

- `src/cli.ts`
  - malformed numeric guard
  - summary/kind option parsing
  - missing flag value branch
- `src/config.ts`
  - unsupported summary strategy / symbol kind guards
- `src/storage.ts`
  - delete-path bookkeeping during watch refresh

Static mutants are ignored in the smoke profile to reduce cost.

## First findings

Smoke run result:

- 47 mutants
- 49s total runtime
- 61.70 mutation score
- 11 survivors
- 7 no-coverage mutants

High-signal survivors from the first smoke run:

- `cli.ts`
  - `optionalNumber` missing-value and invalid-number guards still have
    survivors
  - `parseArgs` missing-value / boolean-flag branch still has survivors
- `config.ts`
  - unsupported summary strategy / symbol kind guards need stronger targeted
    assertions
- `storage.ts`
  - delete-path bookkeeping can still survive mutations around
    `removeFileIndex(...)` truthiness and the `!fileExists` branch

Follow-up task:

- [harden-stryker-smoke-survivors-for-ai-context-engine.md](</Users/macbook/personal/playground/vault/00 Repositories/playground/04 Tasks/tasks/harden-stryker-smoke-survivors-for-ai-context-engine.md>)

## Decision

Stryker is now worth keeping, but only with an explicit split:

- mutation scripts remain fully optional
- smoke profile for intentional local early adoption
- full profile for intentional deeper runs

It is still too expensive to treat either profile as part of the default
inner-loop check.
