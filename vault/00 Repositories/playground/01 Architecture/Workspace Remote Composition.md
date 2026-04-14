---
type: repo-architecture
repo: playground
status: active
summary: The repo keeps one explicit host-to-remote mount contract with todo-app while uplink-game is consumed as a host-local game package.
keywords:
  - microfrontend
  - mount contract
  - todo-app
  - uplink-game
  - workspace import
related_paths:
  - apps/host/src/domain/playground/TodoWorkspace.tsx
  - apps/host/src/domain/playground/GameCanvas.tsx
  - packages/remotes/todo-app/src/contracts.ts
  - packages/remotes/todo-app/src/mount.tsx
  - packages/remotes/uplink-game/src/mount.ts
tags:
  - type/architecture
  - repo/playground
---

# Workspace Remote Composition

## Todo Remote

`@playground/todo-app` is the live injected remote and the main proof that the host can compose a
workspace-local remote through a mount contract.

The public contract is:

- `mount(target, options)`
- `TodoAppMountOptions` with optional `initialTodos` and `onEvent`
- `TodoAppHandle` with `unmount()`, `getSnapshot()`, `replaceTodos()`, and `clearTodos()`
- structured events such as `ready`, `todo:added`, `todo:toggled`, `todo:deleted`,
  `todos:replaced`, and `todos:cleared`

The host's `TodoWorkspace` mounts the remote into a container ref, stores the returned handle, and
keeps host-side metrics in sync through events from the remote.

## Uplink Game Package

`@playground/uplink-game` is still a package consumed by the host, but it is not the main
microfrontend proof. The host imports its `mount()` function in `GameCanvas` and treats it as a
host-local playground surface.

The package owns Phaser setup and returns a cleanup function that destroys the game instance.

## Boundary Rule

Keep remote-facing APIs small and explicit. Host shell behavior should stay in `apps/host/`;
remote-local behavior should stay in the remote package. Shared event shapes and entities should go
through `packages/types` only when they are genuinely shared.
