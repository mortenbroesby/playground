# Repo-Owned Skills

This directory is the target canonical home for repo-owned first-party skills.

Architecture intent:

- keep full skill content out of startup-loaded adapter surfaces
- keep `AGENTS.md` and `CLAUDE.md` thin
- make skill discovery command-first and on-demand

Target command surface:

- `pnpm skills:list`
- `pnpm skills:search`
- `pnpm skills:read <skill-name>`

Current migration status:

- `STORY-1` defines the architecture and boundaries
- later stories move checked-in skills here and rewire the command surface
- external downloaded skills stay out of this checked-in directory
