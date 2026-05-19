# Broesby Family Site Design

Date: 2026-05-19
Status: Approved in chat, written for review

## Summary

Build a new standalone frontend app for `broesby.dk` as a private family hub.
The first version should be intentionally small:

- A shared-password entry screen
- An `About` section about the family
- An `Anecdotes` section for short family stories
- A persistent shared `Chat` section

The app is private-by-convention rather than secure. The shared-password gate is
only meant to keep casual visitors out.

## Goals

- Keep the family site separate from the existing public host app
- Ship a usable v1 quickly without account management
- Support persistent family anecdotes and chat messages
- Keep the UI simple, calm, and mobile-friendly

## Non-Goals

- Real authentication or per-user accounts
- Roles, permissions, or moderation features
- Photo upload or media sharing in v1
- Multiple chat rooms
- Rich profiles or advanced personalization

## Recommended Approach

Create a standalone workspace at `apps/broesby`, modeled after the lightweight
app structure already used in this repo for standalone frontend apps.

The implementation should have two layers:

1. A React/Vite frontend app for the family site
2. A minimal backend/API surface for persistent anecdotes and chat messages

The frontend should not be embedded in `apps/host`, because the family site is
a separate domain and should stay operationally isolated from the public
personal site.

## Information Architecture

The first version should expose three core sections after the password gate:

1. `About`
   A static family introduction and short overview.
2. `Anecdotes`
   A simple chronological feed of short family stories.
3. `Chat`
   One shared family chat room with persistent messages.

Navigation can be a compact top nav or segmented tab-like control as long as it
works well on mobile.

## Login and Identity Model

The app should use one shared password. The password gate is client-side only.
After successful entry, the app should store a lightweight unlocked session in
browser storage and use that to render the main app shell.

This is intentionally not real security. The implementation should avoid
pretending otherwise in naming or architecture.

Because there are no user accounts, author identity for anecdotes and chat
messages should come from a simple display-name prompt or input chosen by the
visitor after entering the shared password.

## Data Model

Version 1 needs only two persistent content types.

### Anecdotes

- `id`
- `authorName`
- `text`
- `createdAt`

### Chat Messages

- `id`
- `authorName`
- `text`
- `createdAt`

Both collections should support create and read flows only in v1. Edit/delete
can be deferred.

## Realtime Behavior

The `Chat` section must be persistent and feel live.

The implementation may use either:

- lightweight polling, or
- a minimal realtime transport

The design does not require true account presence, typing indicators, read
receipts, or delivery state. The user-facing requirement is simpler:

- messages persist between visits
- new messages appear without a full page reload
- sending a message feels immediate

The exact transport choice should follow the simplest repo-compatible path
during implementation planning.

## UX Direction

The UI should be straightforward and non-productized:

- plain password screen
- readable, calm typography
- simple navigation
- basic forms for anecdote and chat entry
- mobile-safe spacing and layout

The visual tone should feel like a family noticeboard, not a startup app and
not a clone of the existing public host site.

## Technical Boundaries

- The new app should live in its own workspace under `apps/`
- Shared UI primitives may be reused from `packages/ui` when they fit
- Any persistence layer should stay minimal and serve only this app's v1 needs
- The app should keep domain logic narrow and easy to test

## Risks and Tradeoffs

### Shared password is weak protection

This is an explicit product choice. It is acceptable only because the goal is a
simple private family space rather than meaningful access control.

### Persistent live chat introduces backend complexity

This is the only feature in scope that requires real state coordination. The
rest of the app should stay simple to keep that complexity contained.

### Photos are deferred on purpose

Photo sharing would materially widen the scope through uploads, storage,
rendering, and likely moderation or curation concerns. Keeping v1 text-first
protects delivery speed.

## Verification Plan

Implementation should verify at least:

- `pnpm --filter @playground/broesby type-check`
- `pnpm --filter @playground/broesby build`
- focused tests for password gating behavior
- focused tests for anecdotes rendering and submission
- focused tests for chat rendering and submission
- a manual browser check of the final flow

## Open Implementation Questions

These are intentionally deferred to the implementation-planning step rather
than blocking the design:

- which persistence backend fits the repo best for a minimal v1
- whether chat updates should use polling or a lightweight realtime mechanism
- whether the display name is requested once per browser session or editable in
  the main app shell

## Initial Delivery Slice

The first implementation slice should produce:

1. a new standalone app workspace
2. the password gate and shell navigation
3. static `About` content
4. persistent `Anecdotes`
5. persistent `Chat`
6. narrow verification for the new workspace

This is the complete v1 scope. Anything beyond that should be treated as a
follow-up.
