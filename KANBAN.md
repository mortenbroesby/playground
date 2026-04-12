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

- `P2` Define a stronger page-composition pattern for public routes
  AI Appetite: 70%
  Why: `Home`, `About`, `Writing`, and `Uses` are simpler now, but they still evolved page by page.
  Outcome: a small set of editorial layout conventions for headings, metadata, link lists, and long-form reading pages.
  Source: architecture review.

- `P2` Reassess whether `System` belongs in the public repo long-term
  AI Appetite: 35%
  Why: it is useful as a playground reference surface, but it may eventually want to become a more internal design-system workspace.
  Outcome: cleaner product-facing information architecture if the public playground grows.
  Source: architecture review.

- `P3` Add a responsive layout system or breakpoint hook
  AI Appetite: 65%
  Why: there is a parked architectural idea to expose breakpoints to consumers and gate heavy experiences on very small screens.
  Outcome: more deliberate small-screen behavior for the game and future heavy remotes.
  Source: `docs/ideas/mobile-future.md` Option C.

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
