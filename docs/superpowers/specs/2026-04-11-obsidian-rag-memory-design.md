# Obsidian RAG Memory System — Design Spec

**Date:** 2026-04-11
**Status:** Approved

---

## Problem

Claude Code sessions start with no memory of prior architectural decisions, active focus areas, or open questions for this repo. Loading full vault files into context is token-expensive and imprecise. We need a way to surface only the relevant chunks of repository knowledge at query time.

---

## Approach

**Custom indexer → claude-mem corpus → MCP query.**

A heading-aware indexer script reads the Obsidian vault, splits notes into section-level chunks with metadata, and feeds them into claude-mem's corpus store. Claude queries via the existing `smart_search` and `smart_unfold` MCP tools — no new MCP server required.

This gives quality RAG (good chunking strategy) with zero new infrastructure (claude-mem already exists and is registered).

---

## Vault Structure

The vault lives at `vault/` in the repo root, tracked by git.

```
vault/
  01 Dashboard/
    Repository Index.md        ← dataview dashboard (index of all repos)
  02 Repositories/
    playground/
      00 Repo Home.md          ← highest-signal RAG chunk per repo
      02 Decisions/            ← ADRs and architectural decisions
      03 Sessions/             ← dated session logs
      04 Questions/            ← open questions with status
  04 Templates/                ← Templater note templates
  05 Scripts/
    repo_context.js            ← Templater helper
```

Seed notes from `docs/obsidian/seed/` and templates from `docs/obsidian/templates/` are copied into the vault during `pnpm rag:init`. Notes are authored in Obsidian normally — the indexer reads from `vault/` without any manual step.

**`.gitignore` additions:**
```
vault/.obsidian/
vault/.trash/
```

Everything else in `vault/` is tracked. Notes are the source of truth.

---

## Indexer (`tools/rag-index.ts`)

Runs via `pnpm rag:index`. Steps:

1. **Walk** `vault/` recursively, skipping `04 Templates/` and `05 Scripts/`
2. **Parse** each note:
   - Extract YAML frontmatter as chunk metadata (`note_type`, `repo_slug`, `tags`, `status`)
   - Split body at H2 headings — each H2 section becomes one chunk
   - Chunk shape: `{ text, source_file, heading, note_type, repo_slug, tags }`
3. **Feed** chunks into claude-mem via `build_corpus("obsidian-vault", chunks)`
   - Incremental: skip chunks where source file mtime hasn't changed
4. **Report** counts: indexed / skipped / updated

**Why heading-level chunking:** Whole-file chunks produce poor retrieval precision — Claude gets the full note when it only needs the "Active Focus" section. H2-level chunks let the vector search return exactly the relevant section (~200-400 tokens) rather than the whole note.

---

## Query Interface

Claude queries the vault via existing claude-mem MCP tools:

| Tool | Use case |
|---|---|
| `smart_search(query)` | Open-ended semantic search across all vault chunks |
| `smart_unfold(path)` | Fetch a specific note section by path |

**Typical response size:** 400-600 tokens for top-K chunks — flat cost regardless of vault size.

**Example:**
```
smart_search("what is the current architecture of the host app")
→ [vault/02 Repositories/playground/00 Repo Home.md § Current Architecture]
   "The host app owns routing and page composition. Remotes are workspace
    packages mounted through local imports and mount contracts..."
```

**CLAUDE.md addition:** A standing instruction to query the `obsidian-vault` corpus at session start for context priming, and before answering architectural or historical questions. This makes RAG automatic rather than opt-in.

---

## Init, Git Hook, and Scripts

### One-time setup — `pnpm rag:init`

1. Copy seed notes from `docs/obsidian/seed/` → `vault/01 Dashboard/` and `vault/02 Repositories/`
2. Copy templates from `docs/obsidian/templates/` → `vault/04 Templates/`
3. Copy `docs/obsidian/templater/repo_context.js` → `vault/05 Scripts/`
4. Install the post-commit git hook (symlink `tools/hooks/post-commit` → `.git/hooks/post-commit`)
5. Run initial `pnpm rag:index` pass

Each developer runs `pnpm rag:init` once after cloning. Since `.git/` is not tracked, the hook symlink must be installed per machine.

### pnpm scripts

```json
"rag:init":  "ts-node tools/rag-init.ts",
"rag:index": "ts-node tools/rag-index.ts"
```

### Post-commit hook (`tools/hooks/post-commit`)

```bash
#!/bin/sh
changed=$(git diff --name-only HEAD~1 HEAD -- vault/)
[ -z "$changed" ] && exit 0
pnpm rag:index
```

Auto-triggers re-indexing only when vault files changed in the commit. Manual `pnpm rag:index` available anytime for immediate refreshes.

---

## What Is Out of Scope

- Multi-repo support beyond `playground` (vault structure supports it; indexer targets one repo for now)
- Remote sync (iCloud/Obsidian Sync) — vault is git-tracked, that is sufficient
- Custom embedding model selection — claude-mem handles embeddings internally
- A query CLI for humans — querying is Claude's job via MCP

---

## Success Criteria

1. `pnpm rag:init` bootstraps a working vault from existing seed files in under 30 seconds
2. `pnpm rag:index` completes a full vault index in under 10 seconds
3. `smart_search("active focus playground")` returns the correct vault section within the top-3 results
4. Post-commit hook fires and re-indexes only when vault files changed
5. Claude sessions start with accurate repo context without loading full files into context
