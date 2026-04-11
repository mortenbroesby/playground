# Obsidian Repository Brain

This repo now includes a starter pack for keeping structured repository memory in Obsidian without
duplicating the repo's real source-of-truth files.

Use this when you want:

- a single Obsidian vault that can track multiple repositories
- one repo home note per codebase
- fast session, decision, and question capture
- Git-backed Markdown notes instead of a separate database

## What lives where

Keep canonical repo truth in the repo:

- `AGENTS.md` for agent operating rules
- `README.md` for repo overview
- `KANBAN.md` for task-shaped work
- `BRAINDUMP.md` for loose capture
- `docs/ideas/` for current direction

Keep cross-session memory in Obsidian:

- architecture summaries
- decision notes
- session logs
- open questions
- dashboard views

## Bootstrap a vault

Run the repo-local bootstrap command once:

```bash
pnpm rag:init
```

What it creates:

- top-level vault folders such as `00 Inbox`, `02 Repositories`, and `04 Templates`
- a `playground` repo area under `02 Repositories/playground/`
- generic templates for repo notes
- one seeded `00 Repo Home.md` for this repository
- one repository index dashboard
- one Obsidian URI cheatsheet note
- one QuickAdd recipes note with concrete capture-path patterns
- one QuickAdd package export plus a lower-level `choices[]` JSON snippet under `06 Exports/quickadd/`
- Templater helper scripts under `05 Scripts/templater/`
- a portable `obsidian-vault` RAG corpus under `.rag/`
- a local `.git/hooks/post-commit` symlink that re-indexes when committed `vault/` files changed

Re-run with `--force` if you want to overwrite the generated starter notes:

```bash
pnpm rag:init -- --force
```

If you want to bootstrap a separate external vault, the lower-level bootstrap command still exists:

```bash
pnpm obsidian:bootstrap -- --vault "/absolute/path/to/your/Obsidian vault"
```

The bootstrap uses the `playground`-specific seed only when the repo slug matches this repository.
Other slugs get a generic repo-home starter instead.

If you are seeding a repo that is not this repo, also pass its real path so `repo_path` is accurate:

```bash
pnpm obsidian:bootstrap -- --vault "/absolute/path/to/your/Obsidian vault" --repo-slug "sample-repo" --repo-path "/absolute/path/to/sample-repo"
```

## Obsidian setup

Enable these core features:

- Properties
- Templates
- Daily Notes
- Bases
- Bookmarks
- Canvas

Recommended community plugins:

- QuickAdd
- Templater
- Dataview
- Obsidian Git
- Advanced URI

Recommended plugin settings:

- Templates folder: `04 Templates`
- Templater template folder: `04 Templates`
- Templater script folder: `05 Scripts/templater`

## Recommended note model

Each repository gets a folder under `02 Repositories/<repo-slug>/` with:

- `00 Repo Home.md`
- `01 Architecture/`
- `02 Decisions/`
- `03 Sessions/`
- `04 Questions/`
- `05 Maps/`
- `06 Exports/`
- `07 Archive/`

Use Properties on every structured note:

- repos use `type: repo`
- sessions use `type: repo-session`
- decisions use `type: repo-decision`
- questions use `type: repo-question`

Keep tags narrow:

- `type/repo`
- `type/session`
- `type/decision`
- `type/question`
- `state/active`
- `state/blocked`
- `state/archived`
- `repo/<slug>`

For retrieval quality, also keep these fields filled in on important notes:

- `summary` for one tight paragraph answering "what is this note about?"
- `keywords` for synonyms and phrases you might actually query later
- `related_paths` where the note speaks about concrete code locations

## QuickAdd setup

The bootstrap now generates two QuickAdd setup artifacts inside the target vault:

- `06 Exports/quickadd/<repo>-repo-brain.quickadd.json`
- `06 Exports/quickadd/<repo>-repo-brain-data-snippet.json`

Use the package file first. The `data-snippet` file is the manual fallback.

### Package import

1. Open QuickAdd settings.
2. Choose `Import package...`.
3. Paste the contents of `06 Exports/quickadd/<repo>-repo-brain.quickadd.json`.
4. Import the generated repo-home, session, decision, and question template choices.

### Manual setup or fallback

If you still prefer hand-built choices, this is the intended structure:

1. `New Repo`
   Create `02 Repositories/<repo>/00 Repo Home.md` from `04 Templates/repo-home.md`.
2. `Log Session`
   Create a note under `02 Repositories/<repo>/03 Sessions/` from `04 Templates/repo-session.md`.
3. `Capture Decision`
   Create a note under `02 Repositories/<repo>/02 Decisions/` from `04 Templates/repo-decision.md`.
4. `Capture Question`
   Create a note under `02 Repositories/<repo>/04 Questions/` from `04 Templates/repo-question.md`.
5. `Append Worklog`
   Append one bullet to today's daily note or call the generated Advanced URI links.

You also get a generated `05 Scripts/QuickAdd Recipes.md` note inside the target vault so the
capture-path patterns are visible from within Obsidian, plus a `06 Exports/quickadd/README.md`
note with import and merge guidance.

## Local RAG verification

Build or refresh the agent-neutral corpus with:

```bash
pnpm rag:index
```

The generated corpus lives at `.rag/obsidian-vault.corpus.json`. It contains heading-level chunks
with source paths, headings, note type, repo slug, tags, status, summary, and keywords. The indexer
skips unchanged notes by mtime and rewrites the portable corpus artifact on each run.

## Codex MCP setup

Register the repo-local MCP server once:

```bash
codex mcp add obsidian-memory -- node /Users/macbook/personal/playground/tools/rag-mcp-server.mjs
```

Then restart Codex. The server exposes these tools:

- `memory_context` for the highest-signal repo primer
- `memory_search` for architecture, decision, session, and question lookup
- `memory_unfold` for expanding a cited source section

The server reads `.rag/obsidian-vault.corpus.json` and runs `pnpm rag:index` automatically if the
corpus is missing.

Run the local verification loop with:

```bash
pnpm obsidian:verify-rag
```

What it proves:

- a vault can be bootstrapped locally
- representative architecture, decision, question, and session notes can be added as Markdown
- local retrieval over note text plus structured metadata returns the expected note for codebase
  memory questions

This is not an embedding benchmark. It is a deterministic proof that the note model is retrieval
friendly enough to support local RAG-style memory on top of plain files.

## Files in this repo

- [`README.md`](/Users/macbook/personal/playground/README.md)
- [`scripts/bootstrap-obsidian-vault.mjs`](/Users/macbook/personal/playground/scripts/bootstrap-obsidian-vault.mjs)
- [`docs/obsidian/templates/repo-home.md`](/Users/macbook/personal/playground/docs/obsidian/templates/repo-home.md)
- [`docs/obsidian/templates/repo-session.md`](/Users/macbook/personal/playground/docs/obsidian/templates/repo-session.md)
- [`docs/obsidian/templates/repo-decision.md`](/Users/macbook/personal/playground/docs/obsidian/templates/repo-decision.md)
- [`docs/obsidian/templates/repo-question.md`](/Users/macbook/personal/playground/docs/obsidian/templates/repo-question.md)
- [`docs/obsidian/templates/daily-note.md`](/Users/macbook/personal/playground/docs/obsidian/templates/daily-note.md)
- [`docs/obsidian/templater/repo_context.js`](/Users/macbook/personal/playground/docs/obsidian/templater/repo_context.js)
