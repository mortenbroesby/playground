# Agent Rules

Shared instruction rules for agents working in this repository.

- `repo-workflow.md`: always-on repo workflow, navigation, memory, and
  verification policy.
- `frontend.md`: path-scoped frontend implementation and design policy.
- `agent-infrastructure.md`: path-scoped policy for hooks, rules, skills, and
  agent configuration.

Shared lifecycle prompts live in `.agents/commands/` and are exposed to Claude
as commands and to Codex as prompts through symlinks. The compact
`engineering-workflow` skill adapts the useful define/plan/build/test/review/ship
setup from `addyosmani/agent-skills` without importing Claude-specific plugin
state.

Codex execution permissions are not markdown rules. They live in
`.codex/rules/*.rules` and follow OpenAI Codex execpolicy syntax. The
`codex/rules` path is a compatibility symlink for docs and tools that look for
that spelling.
