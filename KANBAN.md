# Kanban

Current todo list for moving the repo toward a more elegant frontend architecture while continuing the personal-site transition.

Raw and half-formed ideas belong in [BRAINDUMP.md](/Users/macbook/personal/playground/BRAINDUMP.md). This file should stay task-shaped.

Priority scale:

- `P0` critical next architectural move
- `P1` important near-term follow-up
- `P2` useful next-wave improvement
- `P3` later or exploratory

Lane model:

- `Backlog` useful work worth keeping visible, but not shaped for execution yet
- `Ready` clearly-scoped work that can be picked up next
- `In Progress` work that is actively being executed now
- `Done` work that already landed

AI appetite scale:

- `0%` manual or coordination-heavy work where AI should stay narrow
- `100%` work an agent can drive almost end-to-end with light review

## Backlog

- `P2` To keep kanban lean, lets move the oldest of 5 tasks in done to a separate markdown file, which   we can then toggle on off and inspect separately for historical purposes. maybe within docs?  Ralph loop this.
  AI Appetite: 70%
  Source: Admin app

- `P1` Separate public-page primitives from playground primitives
  AI Appetite: 50%
  Why: the public side is calmer now, but parts of the host still lean on shared UI shaped by the earlier hacker-shell direction.
  Outcome: cleaner editorial defaults for public pages without weakening the playground’s stronger local identity.
  Source: roadmap and host migration checklist.

- `P2` Build a project showcase system
  AI Appetite: 70%
  Why: the host is becoming a real personal site, but projects still do not have a deliberate home beyond writing and playground entries.
  Outcome: projects get compact public entry points and can expand into richer modules when needed.
  Source: `docs/ideas/roadmap.md`.

- `P2` Evaluate SSR or pre-rendering for the public host
  AI Appetite: 60%
  Why: the public site is becoming more content-driven, and client-only rendering may not be the right long-term fit for first load, metadata, and crawler behavior.
  Outcome: a clear decision on whether the host should stay CSR, move to selective pre-rendering, or adopt a fuller SSR path.
  Source: backlog capture.

- `P2` Add a Spotify currently-playing surface to the public site
  AI Appetite: 65%
  Why: a lightweight now-playing module could make the site feel more alive without pushing it back into dashboard territory.
  Outcome: one small public component or route-level module that shows current listening state in a restrained way.
  Source: backlog capture.

- `P2` Define a shared secrets path through Vercel or GitHub
  AI Appetite: 45%
  Why: the repo is accumulating integrations and deployment-adjacent work, but secret handling should not stay ad hoc.
  Outcome: one clear path for shared secrets management, rotation, and local-dev access using either Vercel-managed env vars or GitHub-managed secrets where appropriate.
  Source: backlog capture.

- `P2` Formalize the shared design layer
  AI Appetite: 55%
  Why: the host and remotes are more coherent than before, but the design system is still half toolkit, half historical styling residue.
  Outcome: clearer layout, navigation, reading, and surface primitives that support both editorial pages and playground modules.
  Source: `docs/ideas/roadmap.md`.

- `P2` Audit mobile polish across host pages and remotes
  AI Appetite: 55%
  Why: Option A landed, but there are still parked improvements around touch targets, page auditing, and mobile-specific polish.
  Outcome: better small-screen ergonomics without changing the overall architecture.
  Source: `docs/ideas/mobile-future.md` Option B.

- `P2` Define a stronger page-composition pattern for public routes
  AI Appetite: 70%
  Why: `Home`, `About`, `Writing`, and `Uses` are simpler now, but they still evolved page by page.
  Outcome: a small set of editorial layout conventions for headings, metadata, link lists, and long-form reading pages.
  Source: architecture review.

- `P2` Reduce duplication between public and playground navigation shells
  AI Appetite: 55%
  Why: the current split is directionally right, but it still duplicates some shell mechanics.
  Outcome: shared shell behavior where it helps, separate visual language where it matters.
  Source: architecture review.

- `P2` Reassess whether `System` belongs in the public repo long-term
  AI Appetite: 35%
  Why: it is useful as a playground reference surface, but it may eventually want to become a more internal design-system workspace.
  Outcome: cleaner product-facing information architecture if the public playground grows.
  Source: architecture review.

- `P3` Revisit second MFE only if the todo contract needs validation on a different shape
  AI Appetite: 40%
  Why: uplink-game was inlined as a direct host library; todo-app is now the sole MFE demo and the contract is sufficient for the current scope.
  Outcome: decision to add a second remote only if a concrete new product surface demands the pattern.
  Source: `docs/ideas/roadmap.md`.

- `P3` Add a responsive layout system or breakpoint hook
  AI Appetite: 65%
  Why: there is a parked architectural idea to expose breakpoints to consumers and gate heavy experiences on very small screens.
  Outcome: more deliberate small-screen behavior for the game and future heavy remotes.
  Source: `docs/ideas/mobile-future.md` Option C.

- `P3` Revisit the hacker-UI pass as a playground-only design direction
  AI Appetite: 45%
  Why: the idea is still useful, but it should stay scoped to the playground and not leak back into public editorial pages.
  Outcome: a stronger lab identity without compromising the personal-site side.
  Source: `docs/ideas/parking-lot.md`.

- `P3` Explore a public `Projects` or `Now` surface if content volume justifies it
  AI Appetite: 70%
  Why: the transition docs still identify those as credible next public routes, but they are not yet necessary.
  Outcome: broader personal-site coverage without forcing premature pages.
  Source: `docs/ideas/personal-site-transition.md`.

- `P3` Explore a `Uses` plus `Workbench` split later
  AI Appetite: 45%
  Why: the repo may eventually want a clearer boundary between public personal content and more experimental or power-user tools.
  Outcome: a cleaner long-term information architecture if the playground expands significantly.
  Source: `docs/ideas/roadmap.md`.

- `P3` Add gentle grid-line motion to the public site only if it stays subtle
  AI Appetite: 50%
  Why: a restrained motion layer could add atmosphere, but it should not reintroduce hacker-shell noise to the calmer public pages.
  Outcome: either a minimal public-site motion pass or a clear decision not to ship it.
  Source: `BRAINDUMP.md`.

- `P3` Evaluate plugin or tools showcase surfaces
  AI Appetite: 65%
  Why: internal utilities and AI-assisted workflows could become a meaningful part of the repo story later.
  Outcome: a structured home for internal tools if they grow beyond isolated experiments.
  Source: `docs/ideas/roadmap.md`.

- `P3` Explore a pseudo-terminal mode inside Uplink
  AI Appetite: 55%
  Why: a terminal-adjacent layer could strengthen the app's identity without forcing the whole playground into one visual language.
  Outcome: one scoped Uplink experiment that tests the idea without a site-wide redesign.
  Source: `BRAINDUMP.md`.

- `P3` Define the next gameplay expansion for Uplink
  AI Appetite: 35%
  Why: the current Uplink surface has room to grow, but the next slice needs to be bounded instead of vague.
  Outcome: one concrete gameplay expansion such as progression, interaction loops, or a small shop-like subgame.
  Source: `BRAINDUMP.md`.

- `P3` Prototype a SmartTV-style playground app with a fixed TV aspect ratio
  AI Appetite: 50%
  Why: this would test the playground model on a very different interface shape than the current app set.
  Outcome: an MVP app with a browse surface, fullscreen TV framing, and a simple player flow.
  Source: `BRAINDUMP.md`.

- `P3` Consider realtime or event-stream ideas only after a concrete product need appears
  AI Appetite: 20%
  Why: the repo does not currently need live collaboration or websocket-heavy architecture.
  Outcome: avoid speculative infrastructure until a real surface demands it.
  Source: `docs/ideas/roadmap.md` and parked websocket note.

- `P3` Add richer writing features only after the content system settles
  AI Appetite: 75%
  Why: tags, excerpts, related posts, and archive views should follow a stable content foundation, not precede it.
  Outcome: feature growth that does not lock the writing architecture too early.
  Source: architecture review.

## Ready

- `P1` Pull remaining ideas from `morten.broesby.dk` into the backlog
  AI Appetite: 85%
  Why: there are still useful content and structure cues on the current site that have not been translated into this repo.
  Outcome: a clearer list of pages, copy ideas, and content gaps for the personal-site side.
  Source: existing seeded todo.

- `P1` Verify injected composition path
  AI Appetite: 60%
  Why: the todo remote is still the best live proof of the host-to-remote contract.
  Outcome: keep the microfrontend seam trustworthy while the host architecture evolves.
  Source: existing seeded todo.

- `P2` Fix signal mesh layout positioning after the recent move
  AI Appetite: 45%
  Why: the signal mesh sits too low after the layout shift and currently reads as a visual regression on the playground entry surface.
  Outcome: the canvas sits at the intended height in the playground page again.
  Source: `BRAINDUMP.md`.

## In Progress

## Done

- `P0` Apply EFA layering to host app
  AI Appetite: 60%
  Why: the host had grown organically and its src directory had no clear layer boundaries — pages, components, content, and layouts were all siblings.
  Outcome: `src/` is now structured as `application/`, `domain/`, `ui/`, `infrastructure/`, and `utils/` — matching Elegant Frontend Architecture principles with explicit layer ownership.
  Source: architecture review and `refactor/host-architecture` merge.

- `P1` Add PageMetadata SEO to all playground routes
  AI Appetite: 85%
  Why: playground pages (game, playground, todo, system) had no route-aware head tags after the SEO system was introduced for public pages.
  Outcome: all nine routes now have title, description, canonical, og, and twitter metadata via `react-helmet-async`.
  Source: SEO/favicon planning.

- `P1` Split host architecture into clearer route modules
  AI Appetite: 65%
  Why: `apps/host/src/routes.tsx` was still the switchboard for public pages, playground pages, redirects, and layouts.
  Outcome: route definitions grouped by public site, playground, and legacy redirects so the route tree is easier to reason about.
  Source: architecture review.

- `P1` Introduce a content-domain layer for public pages
  AI Appetite: 70%
  Why: `apps/host/src/content/uses.ts` was carrying about content, profile pitch, uses data, and other public content concerns.
  Outcome: separate content modules by domain such as `about`, `uses`, and `writing`, with clearer ownership and less coupling.
  Source: architecture review.

- `P1` Inline uplink-game and narrow MFE scope to todo-app only
  AI Appetite: 60%
  Why: uplink-game's mount contract (`mount(el) → cleanup`) was just a `useEffect` in disguise; the workspace abstraction added indirection with no benefit.
  Outcome: `GameWorkspace` retired, `UplinkGameCanvas` co-located with game-page, todo-app remains the sole live MFE demo. Routes split into domain modules (`src/routes/`), content split into `about.ts` + `uses.ts`.
  Source: architecture review.

- `P1` Import the legacy blog archive into the host writing system
  AI Appetite: 80%
  Why: the personal site needed the earlier writing to actually live in this repo instead of staying stranded on the old site.
  Outcome: the legacy posts now live as MDX in the host, key linked assets were copied over, and the imported copy received a light editorial cleanup.
  Source: `mortenbroesby/website-blog` and `morten.broesby.dk`.

- `P1` Add a proper favicon and basic app-icon set for the host
  AI Appetite: 85%
  Why: the site no longer ships with generic browser defaults in tabs and saved-site contexts.
  Outcome: the host now serves a favicon, touch icon, and manifest-backed icon set from `index.html`.
  Source: SEO/favicon planning.

- `P2` Add baseline SEO metadata management with React head support
  AI Appetite: 85%
  Why: the host no longer relies on a single static `<title>` and now applies route-aware titles, descriptions, canonicals, and social metadata across public pages and writing posts.
  Outcome: public routes now get a small shared metadata system with route-aware head tags and writing post metadata.
  Source: SEO/favicon planning.

- `P1` Fix Uplink rendering sharpness on the playground route
  AI Appetite: 70%
  Why: the current Uplink surface still looked grainy and undermined the stronger UI direction.
  Outcome: Uplink now renders with an explicit retro-crisp policy, and the implementation is documented in `.specs`.
  Source: `BRAINDUMP.md`.

- `P0` Add an MDX-based content system
  AI Appetite: 90%
  Why: the site now has real public writing, and the previous TypeScript-backed content model was intentionally temporary.
  Outcome: writing posts now live as MDX files with frontmatter and render through a shared content loader in the host.
  Source: existing seeded todo and writing/content direction in `docs/ideas/personal-site-transition.md`.

- `P0` Turn `/` into a real home page instead of redirecting to `/about`
  AI Appetite: 75%
  Why: the personal site needed a proper front door instead of dropping visitors into a secondary page.
  Outcome: the root route now acts as the actual public entry page.
  Source: personal-site transition execution.

- `P0` Split the host into public and playground layouts
  AI Appetite: 70%
  Why: the site needed a clearer boundary between editorial public pages and the playground shell.
  Outcome: the host now has distinct public and playground layout modes.
  Source: host migration execution.

- `P2` Replace `uses/gear` with a cleaner canonical `/uses` structure
  AI Appetite: 60%
  Why: `/uses` is now the canonical public route, while `/uses/gear` remains as a legacy redirect instead of the primary information architecture.
  Outcome: simpler information architecture and fewer transitional redirects on the public side.
  Source: host migration checklist.

- `P0` Add `Writing` as a first-class section with seeded posts
  AI Appetite: 85%
  Why: the personal site direction required a dedicated writing surface instead of burying content.
  Outcome: `Writing` became a top-level public section with routed post pages.
  Source: host migration execution.

- `P0` Move app surfaces under `/playground/*` with legacy redirects
  AI Appetite: 75%
  Why: the playground needed to read as a contained area rather than the main site itself.
  Outcome: apps now live under `/playground/*` and older routes still redirect cleanly.
  Source: host migration execution.

- `P1` Keep the playground navigation limited to playground-only surfaces
  AI Appetite: 65%
  Why: mixing public pages into the playground navigation blurred the product boundary.
  Outcome: the playground nav now lists only playground-native surfaces.
  Source: host cleanup execution.

- `P1` Add a dedicated path back to the main site from the playground
  AI Appetite: 65%
  Why: the split between public site and playground needed a clear way back home.
  Outcome: the playground shell now has an explicit return path to the public site.
  Source: host cleanup execution.

- `P1` Simplify the public shell and reduce hacker-theme bleed on public pages
  AI Appetite: 75%
  Why: the public side needed to feel quieter and more personal than the experimental shell.
  Outcome: public pages now use a simpler editorial language with less hacker-shell residue.
  Source: public-site refinement.

- `P1` Move writing article pages into the editorial visual language instead of the playground language
  AI Appetite: 80%
  Why: writing pages were still leaking the playground theme into the public site.
  Outcome: articles now read like public editorial surfaces rather than terminal-themed modules.
  Source: writing refinement.

- `P1` Rebuild the admin kanban board on Mantine and align it with the markdown workflow model
  AI Appetite: 80%
  Why: the admin app is mid-migration and still needs a cleaner component system plus support for workflow lanes and AI appetite metadata.
  Outcome: the board uses a coherent Mantine surface language, edits lane state directly, and round-trips `AI Appetite` through `KANBAN.md`.
  Source: active admin work.

- `P2` Add a global CMD+K command menu for navigation and power actions
  AI Appetite: 75%
  Why: the site and playground now have enough surfaces that a keyboard-first launcher would improve movement and make the shell feel more intentional.
  Outcome: one command palette for route jumps and a path for later power-user actions.
  Source: `BRAINDUMP.md`.
