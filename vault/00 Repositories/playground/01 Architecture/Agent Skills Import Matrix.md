---
type: repo-architecture
repo: playground
status: active
summary: Import/adapt/reject matrix for bringing addyosmani agent-skills concepts into the repo-native .agents architecture.
keywords:
  - agent skills
  - workflow
  - skills
  - references
  - adapters
tags:
  - type/architecture
  - repo/playground
---

# Agent Skills Import Matrix

## Intent

Record which concepts from `addyosmani/agent-skills` fit the current
`playground` shared-agent architecture and which ones should stay out unless the
architecture changes.

## Import

These concepts fit the existing `.agents/` layout with little or no conflict:

| Upstream concept | Decision | Reason |
| --- | --- | --- |
| Lifecycle commands and umbrella workflow | imported | Already mapped into shared command prompts and `engineering-workflow`. |
| Core lifecycle skills | imported | They fit repo-native shared markdown skills. |
| `debugging-and-error-recovery` | imported | Useful general workflow with no runtime-specific dependency. |
| `documentation-and-adrs` | imported | Matches the repo's README, AGENTS, and vault-memory model. |
| `api-and-interface-design` | imported | The repo has explicit host, remote, and shared-type boundaries. |
| Compact reference checklists | adapted import | Small markdown references fit progressive disclosure without changing adapters. |

## Adapt

These concepts are useful, but only in repo-native form:

| Upstream concept | Decision | Reason |
| --- | --- | --- |
| `browser-testing-with-devtools` | adapted | Keep the skill, but describe browser verification generically so it can work with available automation, devtools, or focused manual checks. |
| Testing, security, performance, and accessibility references | adapted | Use repo-specific commands, rules, and verification norms instead of upstream generic examples. |
| Future persona-style specialists | adapt later | If the repo needs shared personas, source should live under `.agents/agents/` with runtime-specific adapters only where schemas diverge. |

## Reject

These concepts do not fit the current architecture or would create redundant
surface area:

| Upstream concept | Decision | Reason |
| --- | --- | --- |
| `.claude-plugin/` and runtime-specific plugin scaffolding | reject | Conflicts with the repo's thin-adapter model and `agents:check` forbids it. |
| Tool-specific setup docs copied into the repo | reject | Repo-local `AGENTS.md`, README, and thin adapters already document the supported runtime surface. |
| Upstream hooks layout | reject | The repo already has a documented shared hook architecture under `.agents/hooks/`. |
| Duplicative frontend, security, CI, git, and shipping plugin wrappers | reject | Existing rules, repo scripts, hooks, and selected skills already cover the compatible parts without extra wrapper surface. |
| Dormant persona files with no runtime consumer | reject for now | Shared persona source is reasonable later, but unused files would drift immediately. |

## Follow-Up

- Prefer repo-native markdown skills and references over imported runtime
  wrappers.
- Add new support skills only when they map to recurring repo work.
- Revisit shared persona files only if one of the supported runtimes gains a
  stable consumer path for them.
