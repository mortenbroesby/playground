# Context Mode setup plan (Claude Code)

## Goal
Enable one-command preparation today so Context Mode can be installed quickly tomorrow in Claude Code.

## What I verified on GitHub
The official `mksglu/context-mode` README currently documents Claude Code marketplace installation as:

- `/plugin marketplace add mksglu/context-mode`
- `/plugin install context-mode@context-mode`
- then `/context-mode:ctx-doctor` after restart

It also notes Claude Code `v1.0.33+` as a prerequisite.

## Local prep done in this repo
- Added `scripts/setup-context-mode.sh` to validate local prerequisites (`claude` CLI available and version >= `1.0.33`).
- The script prints a copy/paste checklist for tomorrow, including verify and optional maintenance commands.

## Tomorrow runbook
From this repo:

```bash
./scripts/setup-context-mode.sh
```

Then in Claude Code chat:

```text
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
/reload-plugins
/context-mode:ctx-doctor
```

If doctor is clean, Context Mode infrastructure is active.
