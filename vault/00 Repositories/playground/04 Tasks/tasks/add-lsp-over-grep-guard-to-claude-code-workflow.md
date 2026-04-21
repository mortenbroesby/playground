---
type: repo-task
repo: playground
id: add-lsp-over-grep-guard-to-claude-code-workflow
priority: P1
status: Backlog
ai_appetite: 30
source: "week-long manual testing, confirmed 100% success rate"
---

# Add LSP-over-Grep guard to Claude Code workflow

## Why

Grep-based code search causes Claude to read 3–5 files at random from 20+
matches, burning 1,500–2,500 tokens per file (~6,500 total). LSP via
jcodemunch returns exact answers in ~600 tokens. Tested for a week with 100%
success.

## Outcome

An enforced guard that prevents Grep-based symbol/reference searches in code
navigation flows, replacing them with LSP calls through jcodemunch.

## Details

### Scope

- Tighten the "Code Navigation" section in `.agents/rules/repo-workflow.md`
  to explicitly block Grep for symbol lookups — not just prefer jcodemunch
- Add a Claude Code hook in `settings.json` that warns or blocks broad Grep
  scans over source files
- Ensure Claude Code is on the latest version (older versions handle hooks
  poorly)

### Acceptance criteria

- Rule is documented and enforced via hook or explicit policy
- No Grep-based symbol/reference searches in code navigation flows

### Non-goals

- Replacing Grep for non-symbol searches (strings, comments, config values)
- Changing LSP tooling itself
