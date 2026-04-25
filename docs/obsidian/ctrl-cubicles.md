# Ctrl/Cubicles Setup

This repo recommends the VS Code extension `bulletproof-sh.ctrl`.

## What is set up

- `.vscode/extensions.json` recommends the extension in this workspace.
- `.vscode/tasks.json` adds `Ctrl: Start Daemon` for the companion local daemon.
- `package.json` adds `pnpm ctrl:daemon` as the CLI equivalent.

## Current status

- The extension is already installed locally on this machine as
  `bulletproof-sh.ctrl` `v1.2.8`.

## How to use it

1. Open this repo in VS Code.
2. Open the Ctrl panel with `Ctrl: Show Panel` from the command palette if it
   does not appear automatically.
3. Run `Tasks: Run Task` and choose `Ctrl: Start Daemon` if you want the web
   dashboard path, or run `pnpm ctrl:daemon` in a terminal.
4. Start Codex CLI in this repo. Ctrl should auto-detect supported agent
   sessions in the workspace.

## Notes

- The extension itself works inside VS Code without extra repo configuration.
- The daemon is only needed for the browser dashboard and sharing flow.
- The daemon package is fetched on demand with `npx`, so the first run requires
  network access.
