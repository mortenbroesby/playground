---
id: "mem-20260429-uplink-hacker-typer-mechanic"
type: "architecture-record"
repo_slug: "playground"
title: "Uplink: Hacker Typer Mechanic"
status: "archived"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Archived feature-change note for the original hacker-typer mechanic in `HackScene.ts`; useful as history, not as a current architecture record."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
---

**Added:** 2026-04-13
**File:** `packages/remotes/uplink-game/src/game/scenes/HackScene.ts`

## What Changed

Replaced the passive auto-tween tool progress with an active typing mechanic:

- Clicking a tool activates it (`[TYPE TO HACK...]`); the player must type to fill the progress bar
- Each keypress advances the bar by a random increment (base ± 30% variance per tool's keystroke target)
- 1–3 random chars are revealed per keypress from a shuffled `HACK_COMMANDS` corpus, streaming char-by-char in cyan into the system log
- When idle >500ms: bar decays at 3%/s AND trace ticks an extra +1%/s (2× total)
- Commands graduate from live typing line into the narrative log scroll on completion
- `HACK_COMMANDS` corpus is shuffled on each `init()` for replay variety

## Keystroke Targets

| Tool | Keystrokes |
|------|-----------|
| CRACK PASSWORD | ~50 |
| BYPASS FIREWALL | ~35 |
| WIPE LOGS | ~8 |

## Architecture Notes

- `update()` method added to handle frame-by-frame decay and idle trace accumulation
- `typingLineText` lives outside `logTexts` array; promoted into it when a command completes
- `LOG_MAX = 11` (not 12) reserves one visual slot for the live typing line
- No new files — all changes in `HackScene.ts`
