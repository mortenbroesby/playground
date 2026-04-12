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

- `P2` Define a stronger page-composition pattern for public routes
  AI Appetite: 70%
  Why: `Home`, `About`, `Writing`, and `Uses` are simpler now, but they still evolved page by page.
  Outcome: a small set of editorial layout conventions for headings, metadata, link lists, and long-form reading pages.
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
