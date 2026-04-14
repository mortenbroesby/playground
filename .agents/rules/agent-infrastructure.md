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
- Keep `codex/rules` as a compatibility symlink to `.codex/rules`.
- Keep shared commands, hooks, skills, and instruction rules under `.agents/`.
- Runtime-specific directories should be thin adapters or symlinks:
  `.claude/*`, `.codex/*`, `.github/skills`, and `.opencode/*`.
- Hook scripts should be focused, deterministic, fast, and single-purpose.
- Validate hook stdin as untrusted input; resolve paths against the project root;
  redact secrets before logging.
- Do not add network or long-running work to hooks unless the hook is explicitly
  designed as optional post-action automation.
- Keep hook architecture notes in
  `vault/02 Repositories/playground/01 Architecture/Agent Hooks.md`.
- Run `pnpm agents:check` after changing agent adapters, hooks, rules, or
  symlinks.
