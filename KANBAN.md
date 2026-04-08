# Kanban

Current todo list for moving the repo toward a more elegant frontend architecture while continuing the personal-site transition.

Priority scale:

- `P0` critical next architectural move
- `P1` important near-term follow-up
- `P2` useful next-wave improvement
- `P3` later or exploratory

## Now

- [ ] `P0` Add an MDX-based content system
  Why: the site now has real public writing, and the current TypeScript-backed content model is intentionally temporary.
  Outcome: MDX-backed articles with frontmatter, shared metadata, and a cleaner path for richer long-form content.
  Source: existing seeded todo and writing/content direction in `docs/ideas/personal-site-transition.md`.

- [ ] `P1` Pull remaining ideas from `morten.broesby.dk` into the backlog
  Why: there are still useful content and structure cues on the current site that have not been translated into this repo.
  Outcome: a clearer list of pages, copy ideas, and content gaps for the personal-site side.
  Source: existing seeded todo.

- [ ] `P1` Verify injected composition path
  Why: the todo remote is still the best live proof of the host-to-remote contract.
  Outcome: keep the microfrontend seam trustworthy while the host architecture evolves.
  Source: existing seeded todo.

- [ ] `P1` Split host architecture into clearer route modules
  Why: `apps/host/src/routes.tsx` is still the switchboard for public pages, playground pages, redirects, and layouts.
  Outcome: route definitions grouped by public site, playground, and legacy redirects so the route tree is easier to reason about.
  Source: architecture review.

- [ ] `P1` Introduce a content-domain layer for public pages
  Why: `apps/host/src/content/uses.ts` is carrying about content, profile pitch, uses data, and other public content concerns.
  Outcome: separate content modules by domain such as `about`, `uses`, and `writing`, with clearer ownership and less coupling.
  Source: architecture review.

## Next

- [ ] `P1` Separate public-page primitives from playground primitives
  Why: the public side is calmer now, but parts of the host still lean on shared UI shaped by the earlier hacker-shell direction.
  Outcome: cleaner editorial defaults for public pages without weakening the playground’s stronger local identity.
  Source: roadmap and host migration checklist.

- [ ] `P1` Add a second remote that proves the pattern on something meaningfully different from todo
  Why: the repo still leans heavily on one injected remote as proof of the architecture.
  Outcome: stronger confidence that the microfrontend contract is reusable and not overfit to the todo example.
  Source: `docs/ideas/roadmap.md`.

- [ ] `P2` Build a project showcase system
  Why: the host is becoming a real personal site, but projects still do not have a deliberate home beyond writing and playground entries.
  Outcome: projects get compact public entry points and can expand into richer modules when needed.
  Source: `docs/ideas/roadmap.md`.

- [ ] `P2` Replace `uses/gear` with a cleaner canonical `/uses` structure
  Why: the current redirect works, but it reflects the older route shape rather than the current public-site intent.
  Outcome: simpler information architecture and fewer transitional redirects on the public side.
  Source: host migration checklist.

- [ ] `P2` Formalize the shared design layer
  Why: the host and remotes are more coherent than before, but the design system is still half toolkit, half historical styling residue.
  Outcome: clearer layout, navigation, reading, and surface primitives that support both editorial pages and playground modules.
  Source: `docs/ideas/roadmap.md`.

- [ ] `P2` Audit mobile polish across host pages and remotes
  Why: Option A landed, but there are still parked improvements around touch targets, page auditing, and mobile-specific polish.
  Outcome: better small-screen ergonomics without changing the overall architecture.
  Source: `docs/ideas/mobile-future.md` Option B.

## Later

- [ ] `P2` Define a stronger page-composition pattern for public routes
  Why: `Home`, `About`, `Writing`, and `Uses` are simpler now, but they still evolved page by page.
  Outcome: a small set of editorial layout conventions for headings, metadata, link lists, and long-form reading pages.
  Source: architecture review.

- [ ] `P2` Reduce duplication between public and playground navigation shells
  Why: the current split is directionally right, but it still duplicates some shell mechanics.
  Outcome: shared shell behavior where it helps, separate visual language where it matters.
  Source: architecture review.

- [ ] `P2` Reassess whether `System` belongs in the public repo long-term
  Why: it is useful as a playground reference surface, but it may eventually want to become a more internal design-system workspace.
  Outcome: cleaner product-facing information architecture if the public playground grows.
  Source: architecture review.

- [ ] `P3` Add a responsive layout system or breakpoint hook
  Why: there is a parked architectural idea to expose breakpoints to consumers and gate heavy experiences on very small screens.
  Outcome: more deliberate small-screen behavior for the game and future heavy remotes.
  Source: `docs/ideas/mobile-future.md` Option C.

- [ ] `P3` Revisit the hacker-UI pass as a playground-only design direction
  Why: the idea is still useful, but it should stay scoped to the playground and not leak back into public editorial pages.
  Outcome: a stronger lab identity without compromising the personal-site side.
  Source: `docs/ideas/parking-lot.md`.

- [ ] `P3` Explore a public `Projects` or `Now` surface if content volume justifies it
  Why: the transition docs still identify those as credible next public routes, but they are not yet necessary.
  Outcome: broader personal-site coverage without forcing premature pages.
  Source: `docs/ideas/personal-site-transition.md`.

- [ ] `P3` Explore a `Uses` plus `Workbench` split later
  Why: the repo may eventually want a clearer boundary between public personal content and more experimental or power-user tools.
  Outcome: a cleaner long-term information architecture if the playground expands significantly.
  Source: `docs/ideas/roadmap.md`.

- [ ] `P3` Evaluate plugin or tools showcase surfaces
  Why: internal utilities and AI-assisted workflows could become a meaningful part of the repo story later.
  Outcome: a structured home for internal tools if they grow beyond isolated experiments.
  Source: `docs/ideas/roadmap.md`.

- [ ] `P3` Consider realtime or event-stream ideas only after a concrete product need appears
  Why: the repo does not currently need live collaboration or websocket-heavy architecture.
  Outcome: avoid speculative infrastructure until a real surface demands it.
  Source: `docs/ideas/roadmap.md` and parked websocket note.

- [ ] `P3` Add richer writing features only after the content system settles
  Why: tags, excerpts, related posts, and archive views should follow a stable content foundation, not precede it.
  Outcome: feature growth that does not lock the writing architecture too early.
  Source: architecture review.

## Done

- [x] `P0` Turn `/` into a real home page instead of redirecting to `/about`
- [x] `P0` Split the host into public and playground layouts
- [x] `P0` Add `Writing` as a first-class section with seeded posts
- [x] `P0` Move app surfaces under `/playground/*` with legacy redirects
- [x] `P1` Keep the playground navigation limited to playground-only surfaces
- [x] `P1` Add a dedicated path back to the main site from the playground
- [x] `P1` Simplify the public shell and reduce hacker-theme bleed on public pages
- [x] `P1` Move writing article pages into the editorial visual language instead of the playground language
