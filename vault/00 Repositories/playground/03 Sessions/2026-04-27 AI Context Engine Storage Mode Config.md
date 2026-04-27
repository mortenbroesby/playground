---
title: AI Context Engine Storage Mode Config
date: 2026-04-27
project: playground
---

Phase 6 config follow-up for Astrograph storage mode.

Goal:

- expose repo-configured storage mode explicitly instead of hard-coding it only in runtime defaults

Landed:

- added `storageMode` to `astrograph.config.json`
- resolved and threaded `storageMode` through repo config loading and default engine config creation
- ensured indexing, diagnostics, and doctor all reflect the configured storage mode
- kept the supported value set intentionally narrow at `wal`

Why:

- the spec called for storage-mode config support
- even with a single supported mode today, making it explicit keeps the contract durable and visible
