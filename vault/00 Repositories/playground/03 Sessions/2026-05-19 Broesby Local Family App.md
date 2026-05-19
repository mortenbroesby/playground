---
id: "mem-20260519-broesby-local-family-app"
type: "session"
repo_slug: "playground"
title: "Broesby Local Family App"
status: "active"
created: "2026-05-19"
updated: "2026-05-19"
owner: "agent"
summary: "Built the Broesby family app into a real local-first frontend: shared-password gate, display-name capture, browser-local anecdotes, browser-local chat, standalone deployment notes, optional empty-password access, and a darker Atlantic visual redesign."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "broesby"
  - "family app"
  - "localStorage"
  - "anecdotes"
  - "chat"
  - "empty password"
  - "atlantic redesign"
links:
  parents: []
  children: []
  related:
    - "mem-20260519-broesby-standalone-app-workspace"
    - "mem-20260519-broesby-scaffold-quality-fixes"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-06-02"
  expires_after: "2026-11-19"
  keep: false
branch: "main"
touched_paths:
  - "apps/broesby/AGENTS.md"
  - "apps/broesby/.env.example"
  - "apps/broesby/README.md"
  - "apps/broesby/src/App.tsx"
  - "apps/broesby/src/components/AboutSection.tsx"
  - "apps/broesby/src/components/AnecdotesSection.tsx"
  - "apps/broesby/src/components/AppShell.tsx"
  - "apps/broesby/src/components/ChatSection.tsx"
  - "apps/broesby/src/components/DisplayNameDialog.tsx"
  - "apps/broesby/src/components/PasswordGate.tsx"
  - "apps/broesby/src/config.ts"
  - "apps/broesby/src/lib/session.ts"
  - "apps/broesby/src/lib/storage.ts"
  - "apps/broesby/src/lib/types.ts"
  - "apps/broesby/src/styles.css"
  - "apps/broesby/tests/anecdotes.integration.test.tsx"
  - "apps/broesby/tests/app.integration.test.tsx"
  - "apps/broesby/tests/chat.integration.test.tsx"
  - "apps/broesby/vercel.json"
---

## Goal

Turn the Broesby scaffold into a usable first version of a family site without
adding any backend or shared auth infrastructure.

## Actions taken

- added a client-side shared-password gate with session persistence
- added a display-name prompt stored per browser
- implemented `About`, `Anecdotes`, and `Chat` sections
- stored anecdotes and chat messages in browser `localStorage`
- added focused unit and integration coverage for gate, session, storage,
  anecdotes, and chat flows
- added app-local setup notes and SPA deployment rewrites
- made the shared password optional so an empty configured value allows direct
  entry
- shifted the visual system toward a darker Atlantic palette with sharper,
  less-rounded geometry

## Tests run

- `pnpm --filter @playground/broesby test`
- `pnpm --filter @playground/broesby type-check`
- `pnpm --filter @playground/broesby build`

## Findings

- browser-local persistence keeps the first version extremely simple, but the
  content is not shared across devices or browsers
- plain React plus local CSS was enough for this slice; no extra UI or backend
  dependencies were needed
- leaving the password empty now behaves as "no password required" while still
  using the same client-side gate flow
- the redesigned shell now feels more atmospheric and blue-led without changing
  the underlying app structure or behavior

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice
