# Mobile-first polish implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two real mobile problems — nav eating 25% of screen width, and game canvas blocking scroll on touch.

**Architecture:** Lift `isDrawerOpen` state into `App.tsx`; pass it down to `Header` (hamburger button) and a new `MobileDrawer` component. Sidebar gets `hidden md:block` to disappear below 768px. Game canvas gets `touch-action: none` via Tailwind and Phaser gets `activePointers: 2`.

**Tech Stack:** React 18, React Router, Tailwind CSS, Phaser 3, Vitest, pnpm workspaces

---

## File map

| Status | File | Change |
|---|---|---|
| Modify | `packages/remotes/uplink-game/src/mount.ts` | Add `input: { activePointers: 2 }` to Phaser config |
| Modify | `apps/host/src/components/game-workspace.tsx` | Add `[touch-action:none]` to canvas wrapper div |
| Modify | `apps/host/src/App.tsx` | Add `isDrawerOpen` state, pass to Header and MobileDrawer |
| Modify | `apps/host/src/components/header.tsx` | Add `onMenuOpen` prop and hamburger button (md:hidden) |
| Create | `apps/host/src/components/mobile-drawer.tsx` | Slide-in nav overlay; closes on nav, outside tap, Escape |
| Modify | `apps/host/src/components/sidebar.tsx` | Add `hidden md:block` so sidebar disappears below md |

---

## Task 1: Game canvas — touch fix

**Files:**
- Modify: `packages/remotes/uplink-game/src/mount.ts`
- Modify: `apps/host/src/components/game-workspace.tsx`

No test needed — these are a one-line config addition and a CSS class. Verified by type-check and build.

- [ ] **Step 1: Add `activePointers` to Phaser config**

Open `packages/remotes/uplink-game/src/mount.ts`. The current config is:

```ts
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: el,
  width: 900,
  height: 560,
  backgroundColor: '#030b0d',
  scene: [NetworkMapScene, HackScene, MissionEndScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
```

Add `input: { activePointers: 2 }` so it becomes:

```ts
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: el,
  width: 900,
  height: 560,
  backgroundColor: '#030b0d',
  scene: [NetworkMapScene, HackScene, MissionEndScene],
  input: {
    activePointers: 2,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
```

- [ ] **Step 2: Add `touch-action: none` to game canvas wrapper**

Open `apps/host/src/components/game-workspace.tsx`. The current canvas wrapper is:

```tsx
<div ref={containerRef} data-testid="game-container" className="aspect-[900/560] w-full bg-[#030b0d]" />
```

Add `[touch-action:none]` to the className:

```tsx
<div ref={containerRef} data-testid="game-container" className="aspect-[900/560] w-full bg-[#030b0d] [touch-action:none]" />
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @playground/uplink-game type-check
pnpm --filter @playground/host type-check
```

Expected: both exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/remotes/uplink-game/src/mount.ts apps/host/src/components/game-workspace.tsx
git commit -m "fix: enable touch input on game canvas"
```

---

## Task 2: Lift drawer state into App.tsx

**Files:**
- Modify: `apps/host/src/App.tsx`
- Modify: `apps/host/src/components/header.tsx`

- [ ] **Step 1: Write the failing test**

Add to `apps/host/tests/host.routes.test.tsx` inside the `describe('host routes')` block (after the last `it`):

```ts
it('renders a mobile menu button in the header', async () => {
  await renderRoute('/about');
  expect(getByTestId('mobile-menu-button')).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm --filter @playground/host test
```

Expected: FAIL — `Expected element with data-testid="mobile-menu-button"`

- [ ] **Step 3: Update Header to accept `onMenuOpen` prop**

Replace the contents of `apps/host/src/components/header.tsx` with:

```tsx
import { Badge } from '@playground/ui';
import { useLocation } from 'react-router-dom';
import { appStatusMeta } from '@/lib/theme';

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const location = useLocation();
  const activeRoute = appStatusMeta[location.pathname] ?? {
    code: 'SYS-00',
    status: 'standby',
  };

  return (
    <header className="border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="status-led status-led--live" aria-hidden="true" />
            <div className="min-w-0">
              <p className="chrome-label text-primary">playground</p>
              <p className="terminal-heading truncate text-sm text-foreground">operations shell</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Badge tone="primary">host online</Badge>
            <Badge tone="muted">{activeRoute.code}</Badge>
            <span className="chrome-label text-muted-foreground">{activeRoute.status}</span>
          </div>
        </div>

        <button
          data-testid="mobile-menu-button"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-md border border-border/60 bg-background/30 p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
        >
          <span className="chrome-label text-base leading-none">≡</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Update App.tsx to hold state and pass it down**

Replace the contents of `apps/host/src/App.tsx` with:

```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="terminal-app flex h-screen flex-col overflow-hidden text-foreground antialiased">
      <Header onMenuOpen={() => setIsDrawerOpen(true)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="terminal-grid terminal-scrollbars flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to confirm the new test passes**

```bash
pnpm --filter @playground/host test
```

Expected: all 7 tests pass including `renders a mobile menu button in the header`.

- [ ] **Step 6: Commit**

```bash
git add apps/host/src/App.tsx apps/host/src/components/header.tsx apps/host/tests/host.routes.test.tsx
git commit -m "feat: add hamburger button to header, lift drawer state into App"
```

---

## Task 3: MobileDrawer component

**Files:**
- Create: `apps/host/src/components/mobile-drawer.tsx`
- Modify: `apps/host/src/App.tsx`

- [ ] **Step 1: Write failing tests**

Add to `apps/host/tests/host.routes.test.tsx` inside the `describe('host routes')` block:

```ts
it('opens and closes the mobile drawer', async () => {
  await renderRoute('/about');

  // Drawer not in DOM initially
  expect(document.querySelector('[data-testid="mobile-drawer"]')).toBeNull();

  // Open it
  await click(getByTestId('mobile-menu-button'));

  expect(getByTestId('mobile-drawer')).toBeTruthy();

  // Close via the close button
  await click(getByTestId('mobile-drawer-close'));

  await vi.waitFor(() => {
    expect(document.querySelector('[data-testid="mobile-drawer"]')).toBeNull();
  });
});

it('closes the mobile drawer on navigation', async () => {
  const { router } = await renderRoute('/about');

  await click(getByTestId('mobile-menu-button'));
  expect(getByTestId('mobile-drawer')).toBeTruthy();

  // Click a nav link inside the drawer
  const systemLink = document.querySelector<HTMLElement>('[data-testid="mobile-drawer"] a[href="/system"]');
  expect(systemLink).not.toBeNull();
  await click(systemLink!);

  await vi.waitFor(() => {
    expect(router.state.location.pathname).toBe('/system');
    expect(document.querySelector('[data-testid="mobile-drawer"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
pnpm --filter @playground/host test
```

Expected: 2 new FAILs — `mobile-drawer` not found.

- [ ] **Step 3: Create the MobileDrawer component**

Create `apps/host/src/components/mobile-drawer.tsx`:

```tsx
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_APPS } from '@/lib/nav';
import { appStatusMeta } from '@/lib/theme';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        data-testid="mobile-drawer"
        className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/80 bg-card/95 p-4 backdrop-blur-sm"
      >
        <div className="terminal-panel terminal-panel--quiet flex h-full flex-col p-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <p className="chrome-label">App Matrix</p>
              <p className="terminal-heading mt-1 text-sm text-foreground">Routed modules</p>
            </div>
            <button
              data-testid="mobile-drawer-close"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="rounded-md border border-border/60 bg-background/30 p-1.5 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <span className="chrome-label text-sm leading-none">✕</span>
            </button>
          </div>

          <nav className="mt-3 space-y-2">
            {NAV_APPS.map((app) => (
              <NavLink
                key={app.href}
                to={app.href}
                className={({ isActive }) =>
                  cn(
                    'group block rounded-md border px-3 py-2 transition-colors',
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                      : 'border-border/60 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => {
                  const meta = appStatusMeta[app.href];
                  return (
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'status-led mt-1',
                          isActive ? 'status-led--live' : 'status-led--accent opacity-60'
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="terminal-heading text-sm uppercase tracking-[0.16em]">
                          {app.label}
                        </div>
                        <div className="mt-1">
                          <div className="chrome-label">{meta?.code ?? 'SYS-00'}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                            {meta?.status ?? 'standby'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Wire MobileDrawer into App.tsx**

Replace the contents of `apps/host/src/App.tsx` with:

```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { MobileDrawer } from '@/components/mobile-drawer';
import { Sidebar } from '@/components/sidebar';

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="terminal-app flex h-screen flex-col overflow-hidden text-foreground antialiased">
      <Header onMenuOpen={() => setIsDrawerOpen(true)} />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="terminal-grid terminal-scrollbars flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @playground/host test
```

Expected: all 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/host/src/components/mobile-drawer.tsx apps/host/src/App.tsx apps/host/tests/host.routes.test.tsx
git commit -m "feat: add mobile drawer navigation"
```

---

## Task 4: Hide sidebar on mobile

**Files:**
- Modify: `apps/host/src/components/sidebar.tsx`

CSS-only change. No test needed — JSDOM does not apply Tailwind breakpoint classes.

- [ ] **Step 1: Add `hidden md:block` to the aside**

Open `apps/host/src/components/sidebar.tsx`. Change the opening `<aside>` tag from:

```tsx
<aside className="w-24 shrink-0 border-r border-border/80 bg-card/70 p-3 sm:w-60 sm:p-4">
```

to:

```tsx
<aside className="hidden w-24 shrink-0 border-r border-border/80 bg-card/70 p-3 md:block md:w-60 md:p-4">
```

Note: `sm:w-60 sm:p-4` becomes `md:w-60 md:p-4` to align the full sidebar expansion with the same `md` breakpoint at which the hamburger button hides.

- [ ] **Step 2: Run full verification**

```bash
pnpm --filter @playground/host lint
pnpm --filter @playground/host type-check
pnpm --filter @playground/host test
pnpm --filter @playground/uplink-game type-check
```

Expected: all pass, 0 errors, 9 tests passing.

- [ ] **Step 3: Commit**

```bash
git add apps/host/src/components/sidebar.tsx
git commit -m "feat: hide sidebar on mobile, show full sidebar at md breakpoint"
```

---

## Done

All 4 tasks complete. Manual check: open the app at 375px viewport width, confirm:
- Sidebar is hidden
- Hamburger button visible in header
- Tapping it opens the drawer
- Tapping a nav link navigates and closes the drawer
- Game canvas scrolls the game, not the page, when touched
