# Host Migration Checklist

Concrete checklist for evolving [`apps/host`](../../apps/host) from the current route/app shell into a personal-site shell with a distinct playground section.

Use this alongside [`personal-site-transition.md`](./personal-site-transition.md). That document explains the why. This one is the execution checklist for the host workspace.

## Completion target

When this checklist is done:

- `/` is the personal homepage
- `About`, `Writing`, `Uses`, and `Playground` are the primary public destinations
- playground apps live under `/playground/*`
- the global shell reads like a personal website, not an operations console
- writing content has a lightweight file-backed workflow

## Current host snapshot

Current route map in [`apps/host/src/routes.tsx`](../../apps/host/src/routes.tsx):

- `/` redirects to `/about`
- `/about`
- `/playground`
- `/system`
- `/todo`
- `/game`
- `/uses` redirects to `/uses/gear`
- `/uses/gear`
- `/readme` redirects to `/about`

Current navigation source:

- [`apps/host/src/lib/nav.ts`](../../apps/host/src/lib/nav.ts)

Current shell components:

- [`apps/host/src/App.tsx`](../../apps/host/src/App.tsx)
- [`apps/host/src/components/header.tsx`](../../apps/host/src/components/header.tsx)
- [`apps/host/src/components/sidebar.tsx`](../../apps/host/src/components/sidebar.tsx)
- [`apps/host/src/components/mobile-drawer.tsx`](../../apps/host/src/components/mobile-drawer.tsx)

Current route coverage:

- [`apps/host/tests/host.routes.test.tsx`](../../apps/host/tests/host.routes.test.tsx)

Adjacent files with migration coupling:

- [`scripts/dev-web.mjs`](../../scripts/dev-web.mjs)
- [`apps/host/index.html`](../../apps/host/index.html)
- [`README.md`](../../README.md)

## Route migration

### 1. Establish the new public route map

Target route map:

- `/`
- `/about`
- `/writing`
- `/writing/:slug`
- `/uses`
- `/playground`
- `/playground/system`
- `/playground/todo`
- `/playground/uplink`

Acceptable transition state:

- keep `/uses` as the public entry while continuing to render through `/uses/gear` internally during the first pass
- add the cleaner internal route shape later only if more uses subpages never materialize

Checklist:

- Add a real home page component in `src/pages/`.
- Stop redirecting `/` to `/about`.
- Add a writing index route.
- Add a writing detail route.
- Move current playground app routes under `/playground/*`.
- Keep `/uses` as the public entry point.
- Do not require flattening `/uses/gear` in the first migration.
- Keep redirects only where they preserve existing links:
  - `/readme` -> `/about` or `/writing`
  - `/game` -> `/playground/uplink`
  - `/todo` -> `/playground/todo`
  - `/system` -> `/playground/system`
  - optional later: `/uses/gear` -> `/uses`

Files to change:

- [`apps/host/src/routes.tsx`](../../apps/host/src/routes.tsx)
- new files in [`apps/host/src/pages`](../../apps/host/src/pages)

Likely follow-up outside `apps/host`:

- update [`scripts/dev-web.mjs`](../../scripts/dev-web.mjs) so local development opens the right landing page
- update [`README.md`](../../README.md) if route examples or startup expectations change

## Layout migration

### 2. Split the shell into public-site and playground layouts

Goal:

- avoid one global UI tone trying to serve both editorial pages and app surfaces

Checklist:

- Extract the current shell into layout-oriented components instead of a single default frame for all routes.
- Create a public layout for:
  - `/`
  - `/about`
  - `/writing`
  - `/writing/:slug`
  - `/uses`
- Create a playground layout for:
  - `/playground`
  - `/playground/*`
- Keep route composition host-owned. Do not make the public pages remotes.

Recommended structure:

- `src/layouts/public-layout.tsx`
- `src/layouts/playground-layout.tsx`
- optional shared primitives in `src/components/`

Files likely affected:

- [`apps/host/src/App.tsx`](../../apps/host/src/App.tsx)
- [`apps/host/src/components/header.tsx`](../../apps/host/src/components/header.tsx)
- [`apps/host/src/components/sidebar.tsx`](../../apps/host/src/components/sidebar.tsx)
- [`apps/host/src/components/mobile-drawer.tsx`](../../apps/host/src/components/mobile-drawer.tsx)

## Navigation migration

### 3. Replace app-matrix navigation with site navigation

Checklist:

- Change primary nav labels to:
  - `Home`
  - `About`
  - `Writing`
  - `Uses`
  - `Playground`
- Remove `System`, `Todo`, and `Uplink` from the primary site nav.
- Add playground-local navigation for internal app routes.
- Remove shell language like `playground`, `operations shell`, `App Matrix`, `Routed modules`, and route code/status labels from the public layout.
- Keep stronger product/app chrome only in the playground layout.

Files to change:

- [`apps/host/src/lib/nav.ts`](../../apps/host/src/lib/nav.ts)
- [`apps/host/src/lib/theme.ts`](../../apps/host/src/lib/theme.ts)
- [`apps/host/src/components/header.tsx`](../../apps/host/src/components/header.tsx)
- [`apps/host/src/components/sidebar.tsx`](../../apps/host/src/components/sidebar.tsx)
- [`apps/host/src/components/mobile-drawer.tsx`](../../apps/host/src/components/mobile-drawer.tsx)

## Content migration

### 4. Move host-owned content toward a file-backed model

Current content source:

- [`apps/host/src/content/uses.ts`](../../apps/host/src/content/uses.ts)

Checklist:

- Keep short structured data in TypeScript where that remains simplest:
  - socials
  - uses entries
  - app metadata for playground cards
- Move writing content out of hard-coded page files.
- Introduce a content directory for writing:
  - `src/content/writing/` for markdown or MDX files
  - optional `src/content/writing/index.ts` for metadata aggregation
- Define frontmatter fields:
  - `title`
  - `slug`
  - `summary`
  - `date`
  - `tags`
  - `published`
- Seed with 1 to 2 real posts so the route shape is proven.

Decision:

- keep `About` content host-owned
- keep `Uses` content mostly structured data
- make `Writing` file-backed from the start, but do not assume MDX is the first step

Safer implementation order for writing:

- first pass: TypeScript-backed post metadata plus simple post body modules, or markdown with a lightweight index
- second pass: evaluate MDX only if embedded React components are clearly needed
- avoid introducing a content system and route migration in the same change unless the tooling is already proven

## Page-by-page checklist

### 5. Home page

Create a new home page with:

- short personal intro
- current focus statement
- selected writing
- selected playground entries
- lightweight external links

Suggested source files:

- `src/pages/home-page.tsx`
- `src/content/home.ts` or inline data if minimal

### 6. About page

Refactor the current about page so it feels more narrative than dashboard-like.

Checklist:

- keep bio, values, inspirations, and links
- reduce metric framing that does not tell a story
- add a short section explaining the role of the playground
- add selected career highlights or a timeline if it helps the page read more personally

Current source:

- [`apps/host/src/pages/about-page.tsx`](../../apps/host/src/pages/about-page.tsx)
- [`apps/host/src/content/uses.ts`](../../apps/host/src/content/uses.ts)

### 7. Uses page

Checklist:

- keep `/uses` as the canonical public path
- keep the internal `/uses/gear` implementation if it avoids unnecessary churn in the first pass
- align the visual tone with the public layout
- keep it lightweight and scannable

Current source:

- [`apps/host/src/pages/uses-gear-page.tsx`](../../apps/host/src/pages/uses-gear-page.tsx)
- [`apps/host/src/content/uses.ts`](../../apps/host/src/content/uses.ts)

### 8. Writing pages

Checklist:

- add `writing-page.tsx` for the index
- add `writing-post-page.tsx` for individual posts
- add empty-state handling if only drafts exist
- decide whether unpublished drafts are excluded at build time or filtered in-app

### 9. Playground index

Turn the current `/playground` page into a directory rather than a single demo.

Checklist:

- add a short manifesto for what the playground is
- list apps and experiments with status and description
- feature the current signal mesh as one entry, not the entire section
- make it clear the playground can contain different aesthetics and types of ideas

Current source:

- [`apps/host/src/pages/playground-page.tsx`](../../apps/host/src/pages/playground-page.tsx)

### 10. Playground app routes

Checklist:

- move `System` to `/playground/system`
- move `Todo` to `/playground/todo`
- move `Game` to `/playground/uplink`
- keep host-to-remote boundaries explicit for todo and uplink
- preserve current route-level tests while updating route paths

Current sources:

- [`apps/host/src/pages/system-page.tsx`](../../apps/host/src/pages/system-page.tsx)
- [`apps/host/src/pages/todo-page.tsx`](../../apps/host/src/pages/todo-page.tsx)
- [`apps/host/src/pages/game-page.tsx`](../../apps/host/src/pages/game-page.tsx)

## Test migration

### 11. Update route coverage with the new information architecture

Current route tests live in:

- [`apps/host/tests/host.routes.test.tsx`](../../apps/host/tests/host.routes.test.tsx)

Checklist:

- replace the `/` redirect test with a real home-page render test
- update nav-related assertions to match the new primary nav
- update redirect expectations for legacy routes
- add coverage for `/writing`
- add coverage for `/writing/:slug`
- update playground route tests to new nested paths
- keep mobile drawer tests, but assert the new labels
- keep host integration tests for todo and uplink after path changes

## Risk register

### 12A. Main risks and mitigations

#### Risk: the writing plan assumes tooling that does not exist yet

Evidence:

- [`apps/host/package.json`](../../apps/host/package.json) includes Vite + React, but no MDX plugin or content pipeline
- [`apps/host/vite.config.ts`](../../apps/host/vite.config.ts) is a straightforward React Vite config

Mitigation:

- treat file-backed writing as the goal
- start with the lowest-friction content source that works in the current stack
- defer MDX until there is a clear content need for embedded components

Confidence after mitigation:

- high

#### Risk: one global shell currently owns all routes

Evidence:

- [`apps/host/src/App.tsx`](../../apps/host/src/App.tsx) renders one header, one mobile drawer, one sidebar, and one shared `<Outlet />`

Mitigation:

- do not try to restyle the current global shell into serving both site modes
- introduce route-level layouts and move the shell split into the route tree
- keep the public layout simpler and let playground pages retain stronger local chrome

Confidence after mitigation:

- medium-high

#### Risk: legacy route changes can break existing links and route tests

Evidence:

- current tests assert `/todo`, `/game`, `/system`, `/uses/gear`, and `/readme`
- route coverage is centralized in [`apps/host/tests/host.routes.test.tsx`](../../apps/host/tests/host.routes.test.tsx)

Mitigation:

- keep redirects for old public paths during the migration
- update tests in the same change as route moves
- treat route migration and test migration as one unit of work

Confidence after mitigation:

- high

#### Risk: flattening `/uses/gear` to `/uses` may be unnecessary churn

Evidence:

- the current site already has a working nested route and redirect model

Mitigation:

- keep `/uses` as the canonical user-facing entry
- keep `/uses/gear` internally during the first pass if that avoids route churn
- only flatten later if the information architecture clearly stays single-page

Confidence after mitigation:

- high

#### Risk: moving `Todo`, `Uplink`, and `System` under playground can overcouple the migration

Evidence:

- those routes already have tests and, for todo/uplink, mounting behavior tied to current paths

Mitigation:

- migrate them with redirects first
- avoid changing remote contracts while changing route structure
- keep app behavior unchanged until after the IA split is stable

Confidence after mitigation:

- medium-high

#### Risk: route and branding assumptions exist outside the host workspace

Evidence:

- [`scripts/dev-web.mjs`](../../scripts/dev-web.mjs) opens `http://127.0.0.1:3000/todo`
- [`apps/host/index.html`](../../apps/host/index.html) still uses the title `playground`
- [`README.md`](../../README.md) documents `pnpm dev:web` as opening `/todo`

Mitigation:

- treat these as explicit migration follow-ups, not hidden cleanup
- update them in the same phase that changes `/` and the top-level branding
- keep the first public landing page consistent across code, docs, and local dev tooling

Confidence after mitigation:

- high

## Verification sequence

### 12. Use the narrowest meaningful checks per phase

For route, layout, and host-only UI changes:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`

When changing remote mounting paths or contracts:

- `pnpm --filter @playground/todo-app test:integration`

For docs-only planning updates:

- `pnpm lint:md`

## Execution slices

### 13. Ship the migration in bounded slices, not one broad rewrite

The main remaining implementation risk is coupling route moves, shell redesign, content migration, and test updates into one change. Reduce that risk by using these slices.

#### Slice A: establish the public landing page and branding

Scope:

- add `/` as a real page
- keep the existing route tree otherwise stable
- update browser title and local dev landing page
- update top-level wording that clearly conflicts with the personal-site direction

Files likely touched:

- `apps/host/src/routes.tsx`
- `apps/host/src/pages/home-page.tsx`
- `apps/host/index.html`
- `scripts/dev-web.mjs`
- `README.md`
- host route tests for `/`

Checks:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`

Success signal:

- `/` renders a home page
- local dev opens a sensible public entry point
- no existing app routes break

#### Slice B: split public layout from playground layout

Scope:

- introduce route-level layouts
- move public pages to the calmer shell
- keep playground pages on stronger app chrome
- avoid changing app paths yet if possible

Files likely touched:

- `apps/host/src/routes.tsx`
- new `apps/host/src/layouts/*`
- shell components in `apps/host/src/components/`
- nav config in `apps/host/src/lib/`

Checks:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`

Success signal:

- public pages no longer inherit the app-matrix framing
- playground pages still render correctly

#### Slice C: introduce writing with the minimum viable content model

Scope:

- add `/writing`
- add `/writing/:slug`
- seed 1 to 2 posts
- keep the content pipeline intentionally simple

Files likely touched:

- `apps/host/src/routes.tsx`
- writing page components
- `apps/host/src/content/writing/*`
- host route tests

Checks:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`

Success signal:

- writing exists as a first-class section
- the content model is proven without introducing unnecessary tooling

#### Slice D: turn playground into a directory and move app routes under it

Scope:

- convert `/playground` to an index page
- move app routes to `/playground/*`
- keep redirects from old paths
- keep remote behavior unchanged

Files likely touched:

- `apps/host/src/routes.tsx`
- `apps/host/src/pages/playground-page.tsx`
- host route tests

Checks:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/todo-app test:integration`

Success signal:

- playground reads as a section, not a single demo
- old direct links still work
- todo and uplink still mount normally

#### Slice E: optional cleanup after the IA is stable

Scope:

- flatten `/uses/gear` internally if it still makes sense
- refine content tooling only if the simpler model is showing strain
- remove transitional redirects only after they are no longer useful

Checks:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`

## Rollback and guardrails

### 14. Define what should not change in each slice

Guardrails:

- do not change remote contracts while moving route paths
- do not redesign public pages and playground pages in the same broad styling pass
- do not introduce richer writing tooling in the same slice as layout architecture changes
- do not remove legacy redirects until the new structure has settled

Rollback triggers:

- host route tests start failing across unrelated routes
- todo or uplink behavior changes during a route-only migration
- local dev opens a broken or misleading landing page
- the shell split forces duplicated UI logic that is clearly worse than the current structure

If any rollback trigger happens:

- stop the slice
- restore the last stable route behavior
- narrow the next attempt to one layout or route concern at a time

## Suggested execution order

1. Update the route map in `src/routes.tsx`.
2. Add a real home page.
3. Split the shell into public and playground layouts.
4. Replace global navigation labels and remove app-matrix framing from public pages.
5. Keep `/uses` canonical without forcing internal route flattening yet.
6. Add the writing content model and seed posts.
7. Convert `/playground` into an index page.
8. Move app routes to `/playground/*` and add legacy redirects.
9. Update host tests to the new route map.
10. Update startup/docs touchpoints like `scripts/dev-web.mjs`, `apps/host/index.html`, and `README.md`.
11. Run host verification.
12. Only then decide whether a richer content system is warranted.

Safer practical order:

1. Slice A
2. Slice B
3. Slice C
4. Slice D
5. Slice E only if needed

## Guardrails

- Keep changes scoped to `apps/host` unless shared UI truly needs new primitives.
- Do not move public/editorial pages into remotes.
- Do not introduce a second host app just to separate the playground.
- Do not overfit all playground apps into one hacker visual language.
- Keep old links working with redirects where the old routes may already be shared publicly.
