# AGENTS.md

Thin bootstrap for coding agents in this repo.

## Load First

- Follow the shared rules in [`.agents/rules/`](.agents/rules/).
- Follow any deeper `AGENTS.md` closer to the files you edit.
- Use `pnpm`; do not introduce `npm` or `yarn`.
- Keep generated output untouched: `dist/`, `.next/`, `.turbo/`, `coverage/`.

## Fast Map

- `apps/host/`: public site, playground routes, page composition.
- `packages/remotes/todo-app/`: live injected remote and mount-contract proof.
- `packages/remotes/uplink-game/`: game remote consumed by the host.
- `packages/ui/`, `packages/types/`, `packages/config/`: shared UI, contracts,
  and tooling.

## Navigation

- Use `jcodemunch` as the current default for code navigation.
- Keep `ai-context-engine` (`@astrograph`) installed in parallel, but treat it
  as a secondary path until the repo is ready to switch fully.
- For `jcodemunch` flows, start with `plan_turn`, then prefer
  `search_symbols`, `get_file_outline`, and `get_symbol_source`.
- Prefer `search_symbols`, `get_file_outline`, `get_symbol_source`, and
  `get_context_bundle` before broad file reads.
- Use Astrograph selectively for `query_code`, `get_file_outline`, and
  `diagnostics` when you specifically want to validate or compare the newer
  retrieval path.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- Use [`.agents/context/active-context.md`](.agents/context/active-context.md)
  only as compact current-state or handoff context when present.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Code Exploration Policy

- Use `jcodemunch` MCP tools for code navigation instead of broad `Read`,
  `Grep`, `Glob`, or shell exploration.
- Exception: use `Read` when you need exact file content for an edit, because
  the harness expects a read before write-style file changes.
- Start by confirming the repo/index route with `plan_turn`, then use:
  `search_symbols`, `search_text`, `get_file_outline`, `get_symbol_source`,
  `get_context_bundle`, `get_file_tree`, and `get_repo_outline`.
- If a search result returns strong negative evidence, do not keep re-searching
  with random variations hoping the implementation exists. Report the gap.
- After edits, prefer `register_edit` for the touched paths when you need to
  keep the `jcodemunch` index fresh.

## Hooks And Rules

- Shared agent docs live under [`.agents/`](.agents/).
- Codex execution-policy rules live in [`.codex/rules/`](.codex/rules/), with
  [codex/rules](codex/rules) as a docs-path compatibility symlink.
- Claude loads the same shared commands, skills, hooks, and rules through
  `.claude/*` symlinks.

## Ship Default

- Default to finishing work by committing and pushing.
- If the user and agent explicitly agreed on a feature branch, push that
  branch.
- Otherwise commit on the current branch and push `main`.

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:

- Invoke: `pnpm skills:read <skill-name>` (run in your shell)
  - For multiple: `pnpm skills:read skill-one && pnpm skills:read skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:

- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>api-and-interface-design</name>
<description>Design contracts deliberately. Use when changing shared types, mount contracts, module boundaries, route payloads, or public interfaces.</description>
<location>project</location>
</skill>

<skill>
<name>browser-testing-with-devtools</name>
<description>Verify browser-facing behavior with live runtime evidence. Use for UI bugs, interactive flows, layout regressions, and console or network issues.</description>
<location>project</location>
</skill>

<skill>
<name>claude-api</name>
<description>"Build, debug, and optimize Claude API / Anthropic SDK apps. Apps built with this skill should include prompt caching. Also handles migrating existing Claude API code between Claude model versions (4.5 → 4.6, 4.6 → 4.7, retired-model replacements). TRIGGER when: code imports `anthropic`/`@anthropic-ai/sdk`; user asks for the Claude API, Anthropic SDK, or Managed Agents; user adds/modifies/tunes a Claude feature (caching, thinking, compaction, tool use, batch, files, citations, memory) or model (Opus/Sonnet/Haiku) in a file; questions about prompt caching / cache hit rate in an Anthropic SDK project. SKIP: file imports `openai`/other-provider SDK, filename like `*-openai.py`/`*-generic.py`, provider-neutral code, general programming/ML."</description>
<location>project</location>
</skill>

<skill>
<name>code-review-and-quality</name>
<description>Review changes across correctness, readability, architecture, security, performance, and verification gaps.</description>
<location>project</location>
</skill>

<skill>
<name>code-simplification</name>
<description>Reduce complexity while preserving exact behavior. Use when code works but is harder to read, reason about, or change than necessary.</description>
<location>project</location>
</skill>

<skill>
<name>context-engineering</name>
<description>Curate the right repo context at the right time. Use when starting work, switching tasks, or when agent output starts drifting.</description>
<location>project</location>
</skill>

<skill>
<name>debugging-and-error-recovery</name>
<description>Triage failures systematically. Use when tests fail, builds break, runtime behavior is unexpected, or a change needs safe recovery steps.</description>
<location>project</location>
</skill>

<skill>
<name>dispatching-parallel-agents</name>
<description>Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies</description>
<location>project</location>
</skill>

<skill>
<name>doc-coauthoring</name>
<description>Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content. This workflow helps users efficiently transfer context, refine content through iteration, and verify the doc works for readers. Trigger when user mentions writing docs, creating proposals, drafting specs, or similar documentation tasks.</description>
<location>project</location>
</skill>

<skill>
<name>documentation-and-adrs</name>
<description>Record the why alongside the what. Use when workflow, architecture, contracts, setup, or long-lived behavior changes.</description>
<location>project</location>
</skill>

<skill>
<name>engineering-workflow</name>
<description>Use for spec, plan, build, test, review, simplify, or ship workflows. Adapts the agent-skills lifecycle for this repo while keeping Codex, Claude, Copilot, and OpenCode on the shared .agents surface.</description>
<location>project</location>
</skill>

<skill>
<name>executing-plans</name>
<description>Use when you have a written implementation plan to execute in a separate session with review checkpoints</description>
<location>project</location>
</skill>

<skill>
<name>finishing-a-development-branch</name>
<description>Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>incremental-implementation</name>
<description>Implement in thin, verifiable slices. Use when changing more than one file or when behavior needs proof at each step.</description>
<location>project</location>
</skill>

<skill>
<name>mcp-builder</name>
<description>Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).</description>
<location>project</location>
</skill>

<skill>
<name>planning-and-task-breakdown</name>
<description>Break a clear request or spec into small, ordered, verifiable slices with acceptance criteria and dependency notes.</description>
<location>project</location>
</skill>

<skill>
<name>ralph-plan</name>
<description>Interactive planning assistant that helps create focused, well-structured ralph-loop commands through collaborative conversation</description>
<location>project</location>
</skill>

<skill>
<name>receiving-code-review</name>
<description>Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation</description>
<location>project</location>
</skill>

<skill>
<name>requesting-code-review</name>
<description>Use when completing tasks, implementing major features, or before merging to verify work meets requirements</description>
<location>project</location>
</skill>

<skill>
<name>shipping-and-launch</name>
<description>Check release readiness before push or deploy. Use when changes are about to leave the local workspace.</description>
<location>project</location>
</skill>

<skill>
<name>skill-creator</name>
<description>Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.</description>
<location>project</location>
</skill>

<skill>
<name>source-driven-development</name>
<description>Ground framework or library decisions in primary sources. Use when implementation depends on external docs, APIs, or fast-moving tooling behavior.</description>
<location>project</location>
</skill>

<skill>
<name>spec-driven-development</name>
<description>Write a compact, testable spec before implementation. Use for new features, structural changes, or any request that needs clearer boundaries before code.</description>
<location>project</location>
</skill>

<skill>
<name>subagent-driven-development</name>
<description>Use when executing implementation plans with independent tasks in the current session</description>
<location>project</location>
</skill>

<skill>
<name>test-driven-development</name>
<description>Prove behavior with focused tests or concrete reproductions. Use for behavior changes, bug fixes, and logic-heavy work.</description>
<location>project</location>
</skill>

<skill>
<name>using-git-worktrees</name>
<description>Use when starting implementation work that needs isolation from the current workspace. Creates an external sibling worktree from latest main, starts agents inside it, and removes the worktree when finished.</description>
<location>project</location>
</skill>

<skill>
<name>verification-before-completion</name>
<description>Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>project</location>
</skill>

<skill>
<name>writing-plans</name>
<description>Use when you have a spec or requirements for a multi-step task, before touching code</description>
<location>project</location>
</skill>

<skill>
<name>deploy-to-vercel</name>
<description>Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".</description>
<location>global</location>
</skill>

<skill>
<name>vercel-cli-with-tokens</name>
<description>Deploy and manage projects on Vercel using token-based authentication. Use when working with Vercel CLI using access tokens rather than interactive login — e.g. "deploy to vercel", "set up vercel", "add environment variables to vercel".</description>
<location>global</location>
</skill>

<skill>
<name>vercel-composition-patterns</name>
<description>React composition patterns that scale. Use when refactoring components with</description>
<location>global</location>
</skill>

<skill>
<name>vercel-react-best-practices</name>
<description>React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.</description>
<location>global</location>
</skill>

<skill>
<name>vercel-react-native-skills</name>
<description>React Native and Expo best practices for building performant mobile apps. Use</description>
<location>global</location>
</skill>

<skill>
<name>vercel-react-view-transitions</name>
<description>Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.</description>
<location>global</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".</description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
