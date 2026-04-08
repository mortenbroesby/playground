# Task Experience Direction

This note defines the next UI direction for the task/admin experience.

The goal is not to build a bigger dashboard. The goal is to make tasks easier to scan, easier to understand, and easier to act on.

## Desired Experience

The task surface should feel like a calm mission-control board:

- simple enough to understand in a few seconds
- dense enough to show real work at a glance
- editable without turning every card into a mini form
- opinionated about what matters now versus what only matters on demand

The current board is directionally better than the original version, but it still makes the user work too hard:

- every task card exposes too many controls at once
- the board is editable, but not especially overview-friendly
- summary, filters, and task editing all compete at the same visual level
- the live/task context is spread across too many equal-weight surfaces

## Research Signal

Recent "mission control" style AI interfaces consistently converge on a few patterns:

- one main control plane with live status and task flow in one place, not split across many pages
- visible lane-based task state
- lightweight real-time status cues
- richer details available when you focus on one item, not always exposed inline
- activity and operations context treated as secondary to the task surface

Useful references:

- [Mission Control by Builderz](https://mc.builderz.dev/)
- [AgentCenter](https://agentcenter.cloud/features)
- [Archon Mission Control](https://archonhq.ai/)
- [Open Mission Control](https://openclaw-mission-control.dplooy.com/)

The important takeaway is not to copy their complexity. Most of those products are built for multi-agent operations, cost tracking, logs, and fleet management. Our task UI should borrow the clarity, not the panel count.

## Core Product Decision

The task experience should have one primary object: the task board.

Everything else should support that board.

That means:

- the board is the main screen
- summary is compact
- filters are lightweight
- editing deeper task metadata happens in a focused detail surface, not fully expanded on every card

## Recommended Structure

### 1. Thin top strip

Keep only:

- board title
- lane counts
- search
- one add-task action
- one live sync/save state

Do not keep multiple stacked summary panels if they do not change action.

### 2. Main board as the default view

Each lane should be easy to scan vertically.

Each card should show only:

- title
- priority
- lane/status
- AI appetite as read-only
- one short supporting line

Optional supporting line should be one of:

- why
- outcome
- source

not all three by default.

### 3. Focused task detail panel

Selecting a task should open a detail surface, ideally a drawer or side panel.

That panel can hold:

- editable title
- why
- outcome
- source
- priority
- lane
- mark done/open

This is the biggest UX improvement available right now.

It keeps the board easy to overview while preserving full editability.

## Interaction Rules

### Inline editing

Inline editing on the board should be limited to the fastest, highest-signal actions:

- move lane
- change priority
- mark done/open

Everything else should happen in the detail panel.

### AI appetite

`AI Appetite` should stay read-only in the interface.

It is useful as guidance, but it should be treated as system metadata, not user-controlled form state. The UI can display it, sort by it later, or let the system suggest it, but should not invite manual tweaking as a first-class action.

### Card density

Cards should be compact by default:

- no large textareas inline
- no repeated labels where the context is obvious
- no extra controls if they are not used in the common path

### Progressive disclosure

The design should follow this sequence:

1. see tasks
2. identify what matters
3. focus one task
4. edit deeply if needed

The current UI exposes step 4 too early.

## Visual Direction

The interface should look more like a product control surface and less like an editable settings sheet.

That means:

- stronger lane identity
- calmer card interiors
- tighter type scale
- more contrast between overview and detail
- fewer equal-weight input boxes on the main board

Recommended visual hierarchy:

- lane headers: strong and distinct
- cards: compact, quiet, priority-forward
- metadata: badges or short labels
- details: moved to the focused panel

## What To Build Next

### Phase 1

- keep the current board model (`Backlog`, `Ready`, `In Progress`, `Done`)
- sort tasks by priority within each lane
- reduce card surface to compact summary rows
- keep AI appetite visible but read-only

### Phase 2

- add task selection
- add a task detail drawer/panel
- move `Why`, `Outcome`, and `Source` editing into that panel
- keep only priority, lane, and done/open inline

### Phase 3

- add live activity as a secondary collapsible panel or footer strip
- only if it helps explain active work without competing with the board

## Explicit Non-Goals

- do not turn this into a full agent-ops cockpit
- do not add cost charts, logs, or telemetry to the default task view
- do not add more summary panels just to make the screen feel "richer"
- do not expose every field inline on every task card

## Practical Standard

If a first-time user opens the board, they should be able to answer these questions in under five seconds:

- what is in progress?
- what is next?
- what is blocked or at risk?
- what is the most important thing in each lane?

If the UI does not make those answers obvious, it is too busy.
