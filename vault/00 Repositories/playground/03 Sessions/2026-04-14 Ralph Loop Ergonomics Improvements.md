# Ralph Loop Ergonomics Improvements

Date: 2026-04-14

## Summary

Improved the opt-in `scripts/ralph/` runner after the first cut shipped.

## Changes

- validated `prd.json` before loop execution and fail fast on malformed story
  entries
- added explicit story `status` support with `pending`, `in_progress`,
  `blocked`, and `done`
- made the loop prefer `in_progress` stories before pending work
- added `--list` to inspect the story queue without generating a prompt
- added `--story <id>` to target a specific story explicitly
- added `last-run.json` metadata for the most recent generated iteration
- expanded the generated prompt to include the story queue and recent progress
  tail
- fixed prompt file generation to avoid filename collisions on rapid reruns

## Why

The initial runner was good enough to prove the shape, but it still required too
much rediscovery between iterations and did not expose enough story state for
clean resumption. These changes make the loop easier to inspect, resume, and
operate without changing the repo's thin-adapter architecture.
