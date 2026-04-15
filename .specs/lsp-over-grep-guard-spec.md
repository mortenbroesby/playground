# lsp-over-grep-guard-spec.md

## Status

Not yet implemented. Ready for implementation.

## 1. Purpose

Harden the existing jcodemunch guard into an explicit, token-cost-aware
enforcement policy. The current setup blocks correctly but doesn't explain
*why*, and the rule wording is soft enough that agents can rationalize Grep
use. The goal is to make the prohibition unambiguous and the reason
self-evident.

Validated insight: Grep finds 20+ matches → agent reads 3–5 files at random →
~6,500 tokens consumed. jcodemunch LSP returns a precise answer in ~600 tokens.
Tested for one week with 100% success.

## 2. Target

Any agent operating in this repo (Claude, Codex, or other). Not end users.

## 3. Constraints

- Only touch `.agents/rules/repo-workflow.md` and
  `.agents/hooks/jcodemunch-guard.mjs`.
- Do not change hook wiring in `settings.json` — it is already correct.
- Do not block legitimate Grep uses: string/comment searches, non-code support
  files (`vault/`, `docs/`, `README`, `AGENTS`, `CLAUDE`). The existing
  `SAFE_BASH_PATTERNS` allowlist covers these.
- Run `pnpm agents:check` after touching hooks or rules.
- Update the vault note at
  `vault/00 Repositories/playground/01 Architecture/Agent Hooks.md` if hook
  behavior changes.

## 4. Non-goals

- Changing LSP tooling or jcodemunch itself.
- Blocking Grep for non-symbol queries (string literals, config values,
  comments).
- Modifying `settings.json` hook wiring.
- Any application code changes.

## 5. Changes

### 5.1 `repo-workflow.md` — Code Navigation section

Replace the soft guidance ("Avoid broad shell-based code scans when jcodemunch
can answer the question more precisely") with an explicit prohibition:

```
Do not use Grep, Glob, or shell search tools (rg, find, fd) for symbol
lookups, definition searches, or reference queries. Use jcodemunch. Grep costs
~6,500 tokens per lookup (20+ matches, 3–5 file reads); LSP costs ~600 tokens
for an exact answer.
```

Keep the existing positive guidance (prefer `search_symbols`, `search_text`,
etc.) unchanged.

### 5.2 `jcodemunch-guard.mjs` — denial message

Update `buildGuardReason()` to include the token cost:

```
Use jcodemunch for code navigation — it costs ~600 tokens vs ~6,500 for
Grep-based scans. Start with `plan_turn` or `resolve_repo`, then use
`search_symbols`/`search_text`, `get_file_outline`, or `get_symbol_source`.
Use direct file reads only for exact edit context or non-code support files.
```

No logic changes to `shouldBlockGrep`, `shouldBlockGlob`, or `shouldBlockBash`
— they already enforce the right boundaries.

## 6. Acceptance Criteria

1. `repo-workflow.md` Code Navigation section contains an explicit prohibition
   on Grep/Glob/shell for symbol lookups with the token cost stated.
2. The denial message from `jcodemunch-guard.mjs` includes the ~600 vs ~6,500
   token comparison.
3. `pnpm agents:check` passes.
4. Legitimate Grep uses (vault, docs, README, AGENTS, CLAUDE) are not blocked —
   verify by inspecting `SAFE_BASH_PATTERNS` remains unchanged.

## 7. Verification Commands

```
pnpm agents:check
pnpm lint:md
```

Manual check: trigger a `Grep` call on a `.ts` file path — confirm the denial
message includes token cost language.
