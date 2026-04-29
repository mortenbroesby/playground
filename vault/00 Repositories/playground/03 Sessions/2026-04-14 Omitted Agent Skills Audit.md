---
id: "mem-20260414-omitted-agent-skills-audit"
type: "session"
repo_slug: "playground"
title: "Omitted Agent Skills Audit"
status: "active"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Audited omitted upstream agent-skills concepts, imported compatible repo-native skills and references, and recorded explicit reject decisions."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "agent skills"
  - "audit"
  - "references"
  - "debugging"
  - "docs"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-28"
  expires_after: "2026-10-11"
  keep: false
started_at: "2026-04-14 21:35"
touched_paths:
  - ".agents/skills"
  - ".agents/references"
  - ".agents/commands"
  - ".agents/rules"
  - "AGENTS.md"
  - "README.md"
  - "tools/agent-setup-check.mjs"
  - "vault/00 Repositories/playground/01 Architecture/Agent Skills Import Matrix.md"
---

## Outcome

Audited the upstream `addyosmani/agent-skills` concepts that were still omitted
after the first lifecycle adaptation pass.

Imported or adapted in repo-native form:

- `debugging-and-error-recovery`
- `documentation-and-adrs`
- `api-and-interface-design`
- `browser-testing-with-devtools`
- compact shared references under `.agents/references/`

Explicitly rejected:

- runtime-specific plugin scaffolding
- upstream hook layout
- dormant persona files with no current runtime consumer
- duplicated wrapper surfaces already covered by repo rules and checks

## Verification

- `pnpm agents:check`
- `pnpm lint:md`
