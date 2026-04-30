# @playground/uplink-game

Phaser-powered gameplay workspace consumed by the host playground routes.

## Mount surface

- Exposes `mount(el: HTMLElement): () => void`
- Creates the Phaser game instance inside the provided element
- Handles fullscreen plus full-window fallback layout cleanup on unmount

## Scenes

- `NetworkMapScene`
- `HackScene`
- `MissionEndScene`

## Commands

- `pnpm --filter @playground/uplink-game build`
- `pnpm --filter @playground/uplink-game type-check`

## Notes

- The host consumes this package directly from the workspace.
- Keep the exported surface small and gameplay details inside `src/game/`.
