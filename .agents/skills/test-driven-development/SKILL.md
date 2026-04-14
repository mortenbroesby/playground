---
name: test-driven-development
description: Prove behavior with focused tests or concrete reproductions. Use for behavior changes, bug fixes, and logic-heavy work.
---

# Test-Driven Development

## Overview

Tests are proof, not decoration. For bugs, reproduce first when practical. For
new behavior, define the contract before broad implementation.

## When to Use

- Fixing a bug
- Changing business logic or stateful behavior
- Adding new behavior with clear input/output expectations

## Process

1. Identify the behavior contract and edge cases.
2. For bugs, reproduce with a failing test or a concrete command when practical.
3. Make the smallest change that satisfies the contract.
4. Confirm the reproduction now passes.
5. Run narrow regression checks appropriate to the changed surface.

## Rationalizations

| Rationalization | Reality |
| --- | --- |
| "The bug is obvious, I don’t need a repro" | Without proof, you may fix the wrong thing. |
| "This change is too small for tests" | Small behavior changes still need evidence. |
| "Manual testing is enough" | Manual checks help, but they rarely protect against regression. |

## Red Flags

- The fix cannot be demonstrated before and after
- No edge cases were considered
- Tests exist nearby but were not updated
- The change alters behavior but verification only covers type-check or lint

## Verification

- [ ] Behavior contract is explicit
- [ ] Bug reproduction or focused test exists when practical
- [ ] The changed behavior is now proven
- [ ] Regression checks matched the affected surface
