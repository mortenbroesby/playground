# Mobile polish — future options

Parked ideas from the 2026-04-08 mobile-first brainstorm. Option A was implemented first.

## Option B — Layout audit + polish

Extend Option A with:

- Audit all host pages for any remaining non-mobile-first Tailwind patterns (look for `lg:`/`xl:` classes that have no mobile base)
- Increase touch target sizes in the todo remote (`TodoInput`, `TodoList` action buttons) to at least 44px tap targets
- Add visual feedback on the game canvas for touch interactions (brief pulse/glow on the tapped node)
- Audit `<meta name="viewport">` and confirm `user-scalable=no` is appropriate for game page

Estimated scope: 8-10 files. Low risk, good polish.

## Option C — Responsive layout system + game gating

More architectural. Introduce:

- A `useBreakpoint` hook or layout context that exposes the current breakpoint to all consumers
- Use it to gate game rendering: below 480px show a 'best on desktop' message instead of the canvas (avoids a tiny unplayable game on small phones)
- Gate other heavy remotes similarly if added in future

Worth revisiting if more remotes are added or if the game grows more complex interactions that genuinely do not work at small sizes.
