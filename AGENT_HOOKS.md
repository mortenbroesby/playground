# AGENT_HOOKS

Shared hook policy for this repo.

## Goal

Keep Codex and Claude Code on the same security and workflow policy where their
hook surfaces overlap.

- Claude Code gets the full hook surface.
- Codex currently has no active hook wiring in this repo.

## Shared Runner

The repository-owned hook policy lives in:

- [`tools/hooks/agent-hooks.mjs`](tools/hooks/agent-hooks.mjs)

That runner handles:

- `SessionStart` context injection
- `UserPromptSubmit` secret-like prompt blocking
- `PreToolUse` Bash command gating
- `PreToolUse` / `PostToolUse` sensitive-file protection
- `Notification` desktop notifications and event logging
- `SessionEnd` / event logging

## Security Rules

- Block destructive shell commands such as `rm -rf`, `sudo`, piped shell
  downloads, force-pushes, and recursive `chmod 777`.
- Block writes to secrets, keys, `.ssh/`, and generated output directories.
- Block or stop prompts that appear to contain secrets or credentials.
- Keep the policy narrow and deterministic. The hook should explain the denial
  in plain language and avoid hidden side effects.

## Runtime Wiring

### Claude Code

Project hooks live in [`.claude/settings.json`](.claude/settings.json) and
invoke the shared runner with `CLAUDE_PROJECT_DIR`.

### Codex

Codex does not currently have an active hook wired to this shared runner. If
you add one later, keep it as a thin shim that delegates to
`tools/hooks/agent-hooks.mjs`.

## Notes

- The generic policy is shared.
- The hard read/edit/index interception remains Claude Code-only until Codex
  exposes the same hook surface.
