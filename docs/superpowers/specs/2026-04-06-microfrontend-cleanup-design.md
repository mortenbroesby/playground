# Microfrontend Cleanup — Design Spec

## Goal

Reduce 5 apps to 3, replace Mantine with Tailwind + shadcn/ui, enforce dark mode only, and give the host shell a proper navigation structure with header and sidebar.

## Architecture

### Before → After

| Before | After |
|---|---|
| `apps/host` (Next.js shell) | `apps/host` (Next.js shell — redesigned) |
| `apps/compendium` (Next.js shell) | **deleted** |
| `apps/todo-input` (Vite MFE) | **deleted** |
| `apps/todo-list` (Vite MFE) | **deleted** |
| `apps/todo-stats` (Vite MFE) | **deleted** |
| — | `apps/todo-app` (Vite MFE — new, merged) |

### Apps After Cleanup

#### `apps/host` — Shell (Next.js 14, port 3000)

The single entry point for all apps. Owns global layout and navigation.

**Layout:**
- Full-width header: `playground` wordmark (left), `⌘K` command search (center), GitHub link (right)
- Left sidebar below header: app list (`Todo`, `README`), active app highlighted
- Content area: renders the current app (MFE iframe/mount or server component page)

**Routes:**
- `/` — home / default (redirects to `/todo`)
- `/todo` — mounts `todo-app` Vite MFE
- `/readme` — renders README viewer (server component)

**Stack:**
- Next.js 14 App Router
- Tailwind CSS + shadcn/ui (dark mode via `class="dark"` on `<html>`, never toggled)
- No Mantine

**Dark mode:** `<html class="dark">` set statically in root layout. No color scheme toggle, no `ColorSchemeScript`, no `prefers-color-scheme` logic.

---

#### `apps/todo-app` — TodoApp MFE (Vite, port 3101)

Consolidates `todo-input`, `todo-list`, and `todo-stats` into one self-contained micro frontend.

**Exposes:** a single `mount(target: HTMLElement): () => void` remote entry (`remoteEntry.js` at root)

**State:** manages todos internally with `localStorage` (key: `playground.todos.v1`). No bridge, no cross-MFE event bus.

**UI sections (within one app):**
- Input bar — add new todos
- Todo list — display, toggle, delete
- Stats strip — counts (total, done, remaining)

**Stack:**
- Vite + React 18
- Tailwind CSS only (no shadcn — MFE keeps dependencies lean)
- No Mantine

**Composition:** host loads this at runtime from `http://localhost:3101/remoteEntry.js`. No injected/build-time mode.

---

#### README Viewer — Host page (not a separate app)

A Next.js server component page at `/readme` inside `apps/host`. Reads `../../README.md` relative to the host project root at request time using Node `fs`. Renders as styled markdown using `react-markdown` + `rehype-highlight` for code blocks.

Not a separate app or MFE — lives entirely inside host.

---

### Shared Packages (unchanged)

| Package | Change |
|---|---|
| `packages/types` | Keep `Todo` type. Remove `TodoBridge`, `TodoBridgeSnapshot`, `TodoDomainEvent` — no longer needed. |
| `packages/ui` | Keep. Migrate `Button` from custom HTML to Tailwind classes. |
| `packages/config/tsconfig` | No change. |
| `packages/config/eslint` | No change. |

---

## What Gets Removed

- `apps/compendium` — entire directory deleted
- `apps/todo-input` — entire directory deleted
- `apps/todo-list` — entire directory deleted
- `apps/todo-stats` — entire directory deleted
- Mantine (`@mantine/core`, `@mantine/hooks`) from all remaining `package.json` files
- `@tabler/icons-react` from all apps (replace with `lucide-react` via shadcn)
- `ColorSchemeScript`, `MantineProvider` from all layouts
- `TodoBridge` pattern — bridge pub/sub, `getSnapshot`, `publish`, `subscribe`
- Injected composition mode and `NEXT_PUBLIC_TODO_COMPOSITION_MODE` env variable

---

## Dark Mode

- `<html className="dark">` hardcoded in `apps/host/src/app/layout.tsx`
- Tailwind `darkMode: 'class'` in `tailwind.config.ts`
- shadcn components use CSS variables that respond to `.dark` automatically
- `todo-app` Vite MFE: Tailwind dark classes used directly — host injects `dark` class on mount target's ancestor or the MFE sets it on its own root element

---

## shadcn/ui Setup (host only)

Install via CLI into `apps/host`:

```bash
pnpm dlx shadcn@latest init
```

Components needed initially:
- `button` — sidebar nav items, header actions
- `command` — ⌘K search palette
- `separator` — sidebar dividers
- `tooltip` — sidebar item tooltips (collapsed state)
- `badge` — app count or status indicators (optional)

All components are copied into `apps/host/src/components/ui/` — no shared component package for shadcn (each app owns its own copy per shadcn convention).

---

## File Structure After

```
apps/
  host/
    src/
      app/
        layout.tsx          # <html class="dark">, sidebar + header shell
        page.tsx            # redirect to /todo
        todo/
          page.tsx          # mounts todo-app MFE
        readme/
          page.tsx          # server component, renders README.md
      components/
        ui/                 # shadcn components (button, command, etc.)
        sidebar.tsx         # app list nav
        header.tsx          # wordmark + search + github link
        mfe-frame.tsx       # client component that mounts a Vite MFE
  todo-app/
    src/
      components/
        todo-input.tsx
        todo-list.tsx
        todo-stats.tsx
      store.ts              # localStorage state
      App.tsx               # composes all three sections
    remote-entry.tsx        # exports mount()
    vite.config.ts
packages/
  types/
    src/index.ts            # Todo type only
  ui/
    src/
      components/
        Button.tsx          # migrated to Tailwind
docs/
  parking-lot.md
  superpowers/
    specs/
      2026-04-06-microfrontend-cleanup-design.md
```

---

## Out of Scope

- Authentication
- Server-side todo persistence (localStorage only)
- Additional apps beyond Todo and README
- Mobile/responsive layout (desktop-first for now)
- Personal website pivot (parked in `docs/parking-lot.md`)
