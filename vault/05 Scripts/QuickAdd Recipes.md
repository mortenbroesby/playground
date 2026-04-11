---
type: utility
utility: quickadd-recipes
generated_on: 2026-04-11T18:35:01.960Z
tags:
  - utility
---

# QuickAdd Recipes

Use these as the initial QuickAdd definitions for repository-memory capture.

## New Repo

- Choice type: `Capture`
- Template: `04 Templates/repo-home.md`
- File path: `02 Repositories/{{VALUE:repo_slug}}/00 Repo Home.md`
- Create folders if needed: `true`

## Log Session

- Choice type: `Capture`
- Template: `04 Templates/repo-session.md`
- File path: `02 Repositories/{{VALUE:repo_slug}}/03 Sessions/{{DATE:YYYY-MM-DD}} {{VALUE:session_title}}.md`
- Create folders if needed: `true`

## Capture Decision

- Choice type: `Capture`
- Template: `04 Templates/repo-decision.md`
- File path: `02 Repositories/{{VALUE:repo_slug}}/02 Decisions/{{DATE:YYYY-MM-DD}} {{VALUE:decision_title}}.md`
- Create folders if needed: `true`

## Capture Question

- Choice type: `Capture`
- Template: `04 Templates/repo-question.md`
- File path: `02 Repositories/{{VALUE:repo_slug}}/04 Questions/{{DATE:YYYY-MM-DD}} {{VALUE:question_title}}.md`
- Create folders if needed: `true`

## Append Worklog

Option A:

- Use the generated `05 Scripts/Obsidian URI Cheatsheet.md` note.

Option B:

- Choice type: `Capture`
- Capture to active file or today's daily note
- Prefix each line with `- [{{VALUE:repo_slug}}]`

## Recommended variables

- `repo_slug`
- `session_title`
- `decision_title`
- `question_title`
