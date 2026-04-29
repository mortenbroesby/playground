---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# Astrograph Monotonic Alpha Increment

## Decision

Astrograph's trailing `alpha.increment` is monotonic and is never reset.

## Implications

- a minor bump from `0.0.1-alpha.45` becomes `0.1.0-alpha.46`
- a patch bump must also advance the trailing increment
- major bumps still reset minor and patch, but not the trailing increment

## Why

The trailing value is serving as a durable commit-scale sequence number for
Astrograph work, not just a counter scoped to one base semver line.
