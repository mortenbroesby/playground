---
paths:
  - ".agents/**"
  - ".claude/**"
  - ".codex/**"
  - ".github/skills/**"
  - ".opencode/**"
  - "AGENTS.md"
---

# Agent Infrastructure

- Keep `AGENTS.md` thin. Durable policy belongs in `.agents/rules/`, executable
  policy in `.agents/hooks/`, and command escalation policy in `.codex/rules/`.
- Keep durable memory in `vault/` plus `obsidian-memory`; any compact active
  context should live in a shared `.agents/context/` surface so Claude and
  Codex can use the same file.
- Treat `AGENTS.md` as a bootstrap, not a catalog:
  keep it to a few short sections, prefer pointers over inventories, and avoid
  repeating details that already live under `.agents/`.
- Do not add long workflow explanations, change logs, skill inventories, or
  adapter implementation details to `AGENTS.md`.
- When `AGENTS.md` grows, compress it by replacing lists of subdirectories with
  one pointer to the owning docs surface.
- Keep `codex/rules` as a compatibility symlink to `.codex/rules`.
- Keep shared commands, hooks, skills, and instruction rules under `.agents/`.
- Keep any optional active-context bootstrap under `.agents/context/`; do not
  introduce runtime-specific memory files when a shared file can serve both
  Codex and Claude.
- Keep compact shared checklists under `.agents/references/` when a skill needs
  small supporting reference material.
- Runtime-specific directories should be thin adapters or symlinks:
  `.claude/*`, `.codex/*`, `.github/skills`, and `.opencode/*`.
- Put reusable lifecycle prompts in `.agents/commands/` and reusable skills in
  `.agents/skills/`; do not import plugin-specific wrappers when shared files
  can serve Codex and Claude.
- Hook scripts should be focused, deterministic, fast, and single-purpose.
- Validate hook stdin as untrusted input; resolve paths against the project root;
  redact secrets before logging.
- Do not add network or long-running work to hooks unless the hook is explicitly
  designed as optional post-action automation.
- Keep hook architecture notes in
  `vault/02 Repositories/playground/01 Architecture/Agent Hooks.md`.
- Run `pnpm agents:check` after changing agent adapters, hooks, rules, or
  symlinks.
