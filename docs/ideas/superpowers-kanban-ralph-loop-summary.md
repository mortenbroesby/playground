# Superpowers Kanban + Ralph Loop Summary

This note captures the closest open-source comparisons for a future `Superpowers` iteration that combines:

- a kanban-style mission board
- browser-native agent execution
- a Ralph-loop style inspect -> act -> verify cycle

It is meant to complement, not replace, [`task-experience-direction.md`](./task-experience-direction.md).

## Why This Matters

The current admin board already has the right instinct: one place to scan work by lane and open focused details when needed.

What it does not yet express is the agentic side of the workflow:

- task execution as a visible run, not just a static card
- approvals before risky actions
- explicit verification after each attempt
- run history that shows whether a task is converging or looping
- agent state visible beside task state without turning the home screen into a telemetry wall

The right comparison is not a pure kanban tool and not a pure workflow canvas. The useful shape is a hybrid board-plus-mission-control surface.

## Closest Comparisons

Star counts below were checked on GitHub on April 9, 2026.

### 1. Builderz Mission Control

Repo: <https://github.com/builderz-labs/mission-control>  
Stars: `3.9k`

This is the closest comparison for the overall product shell.

Why it matters:

- it is explicitly framed as a mission-control dashboard, not just an agent SDK
- it combines tasks, agents, logs, skills, workflows, and quality gates in one surface
- it shows how orchestration, governance, and operations can live together

What to borrow:

- one operator shell for task state plus agent state
- explicit quality gates before marking work complete
- the idea that a mission surface can manage both live runs and reusable capabilities

What not to copy:

- panel sprawl as the default experience
- spend, logs, security, and fleet concerns competing equally with the board
- a density level that makes first-scan prioritization harder

### 2. OpenHands

Repo: <https://github.com/OpenHands/OpenHands>  
Stars: `70.9k`

This is the closest comparison for the `Ralph loop` part of the product.

Why it matters:

- the main object is an active task run
- the user can watch the agent iterate instead of trusting a black box
- actions and outputs are legible enough to support intervention
- the experience is built around "try, inspect, adjust, continue"

What to borrow:

- visible run timeline per task
- a clear boundary between current attempt and final result
- "continue / revise / retry" semantics instead of one-shot prompts

What not to copy:

- the coding-agent bias
- terminal-heavy interaction as the only mental model

### 3. Magentic-UI

Repo: <https://github.com/microsoft/magentic-ui>  
Stars: `9.8k`

This is the closest comparison for browser-native human-in-the-loop execution.

Why it matters:

- it treats web actions as something the user can supervise
- it keeps the browser task itself central, not buried under config
- it shows that approval checkpoints are part of the product, not an afterthought

What to borrow:

- approval gates for sensitive actions
- explicit browser-task framing
- live step visibility while the mission is running

What not to copy:

- research-prototype roughness
- a browser pane that overwhelms the board when no focused task is selected

### 4. Activepieces

Repo: <https://github.com/activepieces/activepieces>  
Stars: `21.6k`

This is the closest comparison for mixing automation, human input, and repeatable operational flows.

Why it matters:

- it handles workflows and approvals in one product
- it treats humans as first-class participants in automation
- it suggests a path from ad hoc mission to reusable template

What to borrow:

- templates after a successful run
- approval and human-input checkpoints
- clear distinction between one-off work and reusable flow

What not to copy:

- broad enterprise automation sprawl
- a builder-first experience for users who just want to run one mission

### 5. n8n

Repo: <https://github.com/n8n-io/n8n>  
Stars: `183k`

This is the strongest comparison for a mature operator surface, but it is less directly aligned with kanban.

Why it matters:

- it proves that users tolerate dense operational UI if the main flow stays legible
- it has a strong model for turning ad hoc logic into repeatable automation

What to borrow:

- durable run history
- template promotion after success
- compact status signaling

What not to copy:

- canvas-first complexity as the default home screen

### 6. Dify

Repo: <https://github.com/langgenius/dify>  
Stars: `137k`

This is the strongest comparison for productized agent workflows and operational polish.

Why it matters:

- it packages agents, workflows, and ops concerns into one coherent product
- it shows how "agent platform" can feel more product-like than lab-like

What to borrow:

- product-grade run management
- clear separation between build mode and operate mode

What not to copy:

- broad platform scope too early

### 7. Langflow and Flowise

Repos:

- <https://github.com/langflow-ai/langflow> - `147k`
- <https://github.com/FlowiseAI/Flowise> - `51.7k`

These are useful mainly as composition references, not as direct board references.

Why they matter:

- they make multi-step agent logic legible
- they are strong examples of reusable prompt-and-tool templates

What to borrow:

- template vocabulary
- system graphs behind the scenes for advanced mode

What not to copy:

- node-canvas as the default primary view

## Closest Product Read

If the question is "what is the closest comparison to a kanban board plus Ralph loop?", the answer is:

1. `builderz-labs/mission-control` for the overall operator shell
2. `OpenHands` for the loop model
3. `Magentic-UI` for browser execution with approvals
4. `Activepieces` for repeatable human-in-the-loop flows

None of the high-star repos is a clean kanban-native mission board.

That is the product gap:

- kanban tools are good at prioritization and scanability
- agent tools are good at execution and iteration
- very few products make task lanes and agent loops feel like one coherent surface

That gap is the opportunity for `Superpowers`.

## Recommended Shape

The best future direction is not a giant cockpit.

It is a board-first mission-control surface with six core parts:

### 1. Kanban board as home

Use the current lane model as the default overview:

- `Backlog`
- `Ready`
- `In Progress`
- `Done`

But each card should also expose mission state:

- idle
- running
- waiting for approval
- failed verification
- converged

### 2. Prompt bar above the board

The top prompt should create or update work on the board, not bypass it.

Examples:

- create a new mission card
- refine an existing card
- launch a run on the selected card
- turn a successful run into a reusable template

### 3. Run timeline inside task detail

The detail drawer should become the Ralph-loop surface.

For a selected task, show:

- current objective
- current hypothesis or plan
- steps taken
- evidence gathered
- verification result
- next proposed action

This keeps the board scannable while still making the loop visible.

### 4. Approval checkpoints

Before sensitive browser actions, the task should pause visibly in lane context.

Examples:

- submit
- purchase
- publish
- send message
- destructive change

### 5. Convergence state instead of generic completion

`Done` is not enough for agentic work.

The system should express whether a task:

- completed cleanly
- completed with manual intervention
- stalled
- needs another pass
- should be templated

### 6. Template promotion

After a mission succeeds repeatedly, the user should be able to save it as a browser prompt template or reusable workflow.

That bridges one-off missions and systemized superpowers.

## Browser Prompt Options

The prompt surface should feel operational, not chatty. Good options:

- `Research this space, create cards, and rank them by likely leverage.`
- `Open this task, propose the first pass, and wait for approval before acting.`
- `Run a Ralph loop on this card until verification passes or you hit a blocker.`
- `Watch these sources and move the card when a trigger fires.`
- `Reproduce the bug in browser, attach evidence, and suggest the smallest fix.`
- `Turn this finished mission into a reusable template.`
- `Compare these vendors, collect evidence, and update the card with a recommendation.`
- `Prepare the form, stop before submit, and show me the exact final action.`

## Product Rules For Future Iteration

- Board first, canvas second.
- Detail drawer for loop state, not more inline card chrome.
- Approval checkpoints must be visible as task state.
- Verification is a first-class outcome, not hidden in logs.
- A mission can fail gracefully without feeling like the board is broken.
- Repeated successful missions should graduate into templates.

## Suggested Next Step

If this direction is pursued, the next concrete design pass should focus on one narrow workflow:

1. create a task from the prompt bar
2. run a browser mission on that task
3. pause on approval
4. show verification
5. mark the task as converged, blocked, or needs another pass

That is enough to prove whether the board-plus-Ralph-loop model feels meaningfully better than a plain editable kanban board.
