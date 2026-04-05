# Context Mode + Codex plugin setup plan (Claude Code)

## Goal
Enable one-command preparation today so both Context Mode and the OpenAI Codex plugin can be installed quickly tomorrow in Claude Code.

## What I verified on GitHub
The official READMEs currently document:

### Context Mode (`mksglu/context-mode`)
- `/plugin marketplace add mksglu/context-mode`
- `/plugin install context-mode@context-mode`
- then `/context-mode:ctx-doctor` after reload
- prerequisite: Claude Code `v1.0.33+`

### Codex plugin (`openai/codex-plugin-cc`)
- `/plugin marketplace add openai/codex-plugin-cc`
- `/plugin install codex@openai-codex`
- `/reload-plugins`
- `/codex:setup`
- prerequisites include Node.js `18.18+`

## Local prep done in this repo
- Updated `scripts/setup-context-mode.sh` into a combined Claude plugin bootstrap preflight.
- The script now validates:
  - `claude` CLI exists and is `>= 1.0.33`
  - Node.js availability/version guidance for Codex plugin (`>= 18.18.0`)
- It prints a single copy/paste setup block for Claude Code chat so you can run one flow to install both plugins.

## Tomorrow runbook
From this repo:

```bash
./scripts/setup-context-mode.sh
```

Then in Claude Code chat, paste this once:

```text
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/context-mode:ctx-doctor
/codex:setup
```

If both doctor/setup checks are clean, your Context Mode + Codex workflow is ready.
