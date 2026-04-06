# Design System

This document is the current reference for the shared UI tokens and utility classes exposed through
[`@playground/ui`](../packages/ui).

Source of truth:

- [`packages/ui/src/theme.css`](../packages/ui/src/theme.css)

## Search

Search tokens:

```bash
rg -n -- '--[a-z0-9-]+:' packages/ui/src/theme.css
```

Search utility classes:

```bash
rg -n '^\.[a-z0-9-]+' packages/ui/src/theme.css
```

## Tokens

These CSS custom properties currently live in `:root`:

```text
--font-sans
--font-mono
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
--radius
--panel-shadow
--panel-glow
--grid-line
--surface-0
--surface-1
--surface-2
--surface-3
```

## Token Groups

### Typography

```text
--font-sans
--font-mono
```

### Semantic color tokens

```text
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
```

### Surface and effect tokens

```text
--radius
--panel-shadow
--panel-glow
--grid-line
--surface-0
--surface-1
--surface-2
--surface-3
```

## Utility Classes

These shared utility classes are currently defined in `theme.css`:

```text
.terminal-app
.terminal-grid
.terminal-panel
.terminal-panel--quiet
.terminal-panel--glow
.chrome-label
.terminal-heading
.signal-badge
.signal-badge--primary
.signal-badge--accent
.signal-badge--danger
.signal-badge--muted
.status-led
.status-led--live
.status-led--accent
.status-led--danger
.terminal-button
.terminal-button--ghost
.terminal-button--danger
.terminal-input
.metric-panel
.metric-value
.log-panel
.log-line
.terminal-item
.terminal-rule
.terminal-scrollbars
```

## Notes

- This is a pragmatic inventory, not a finalized design-system spec.
- If tokens or utility classes move, update this file alongside `packages/ui/src/theme.css`.
- Prefer adding tokens here only after they become shared concerns, not one-off page tweaks.
