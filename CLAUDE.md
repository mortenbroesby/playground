# Project: playground

A pnpm + Turborepo monorepo playground for experimenting with multi-agent Claude Code workflows and microfrontend delivery.

## Repository Structure

```
playground/
├── apps/
│   └── host/                         # Next.js shell app
├── packages/
│   ├── remotes/
│   │   └── todo-app/                 # Vite microfrontend remote
│   ├── ui/                           # @playground/ui — shared React component library
│   └── config/                       # @playground/config — shared ESLint + TSConfig
│       ├── tsconfig/                 # @playground/tsconfig
│       └── eslint/                   # @playground/eslint-config
├── plugins/                          # Claude Code plugins (root-level for marketplace)
│   └── playground/                   # Skills specific to this repo
├── docs/superpowers/                 # Specs and implementation plans
├── turbo.json                        # Turborepo pipeline
└── pnpm-workspace.yaml               # Workspace globs: apps/*, packages/*, packages/remotes/*, packages/config/*
```

## Skills

### When to use which skill

| Task | Skill |
|:---|:---|
| Adding a new plugin, agent, skill, or command | `plugin-authoring` |
| Scaffolding multiple workspaces in parallel | `wave-orchestration` + `turborepo-workspace-setup` |
| Adding a single new workspace to the monorepo | `turborepo-workspace-setup` |
| Parallel feature development across workspaces | `parallel-feature-development` |
| Complex task decomposition with agent teams | `task-coordination-strategies` |
| Debugging across workspace boundaries | `parallel-debugging` |
| Turborepo caching and pipeline optimization | `turborepo-caching` |
| Monorepo dependency management and scaling | `monorepo-management` |

### Playground skills (this repo)

Install: `/plugin install playground@claude-code-workflows`

- **`plugin-authoring`** — Create new plugins/agents/skills/commands. Covers frontmatter, model tiers, progressive disclosure, PluginEval, and anti-patterns.
- **`wave-orchestration`** — Dispatch parallel sub-agents in waves with strict file ownership. The pattern used to build this monorepo itself.
- **`turborepo-workspace-setup`** — Add new apps/packages, wire shared configs, fix pnpm resolution errors, integrate into Turbo pipeline.

### Relevant skills from other plugins

- **`turborepo-caching`** (`developer-essentials`) — Optimize Turborepo local/remote caching, configure outputs, and tune hit rates.
- **`monorepo-management`** (`developer-essentials`) — Broader monorepo patterns: dependency graph, versioning, workspace boundaries.
- **`parallel-feature-development`** (`agent-teams`) — Coordinate parallel agents building different layers of the same feature.
- **`task-coordination-strategies`** (`agent-teams`) — Decompose complex tasks with dependency graphs for multi-agent execution.
- **`parallel-debugging`** (`agent-teams`) — Investigate issues across workspaces simultaneously with competing hypotheses.

## Monorepo Conventions

### pnpm workspace globs

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/remotes/*'
  - 'packages/config/*'   # required for nested sub-packages
```

### Turbo pipeline

```json
{
  "tasks": {
    "build":      { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint":       {},
    "type-check": { "dependsOn": ["^build"] },
    "dev":        { "persistent": true, "cache": false }
  }
}
```

New workspaces auto-join the pipeline when their `package.json` scripts match task names. No edits to `turbo.json` needed.

### Shared configs

```json
{
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*"
  }
}
```

Extend in `tsconfig.json`:

```json
{ "extends": "@playground/tsconfig/base.json" }
```

### Common commands

```bash
pnpm install              # install all workspace deps
pnpm turbo build          # build in dependency order
pnpm turbo type-check     # TypeScript across all workspaces
pnpm turbo lint           # ESLint across all workspaces
pnpm lint:md              # markdownlint on workspace READMEs
```

## Plugin Authoring Conventions

### Agent frontmatter

```yaml
---
name: agent-name
description: "What this agent does. Use PROACTIVELY when [trigger conditions]."
model: opus|sonnet|haiku|inherit
color: blue|green|red|yellow|cyan|magenta # optional
tools: Read, Grep, Glob # optional — restricts available tools
---
```

### Skill structure

```
skills/<skill-name>/
├── SKILL.md              # Required — frontmatter + content
├── references/           # Optional — supporting material
└── assets/               # Optional — templates, configs
```

Skill frontmatter:

```yaml
---
name: skill-name
description: "Use this skill when [specific trigger conditions]."
---
```

### Command frontmatter

```yaml
---
description: What this command does
argument-hint: <path> [--flag]
---
```

### plugin.json

Only `name` is required. Agents, commands, and skills are auto-discovered.

```json
{ "name": "plugin-name" }
```

### marketplace.json

Agents as `./agents/name.md`, skills as `./skills/skill-name` (directory, not SKILL.md).

## AI Strategy

### Codex-first rule

**For all implementation tasks (writing or modifying code files), use Codex via `codex:codex-rescue` first.**

Only fall back to direct Claude implementation when:
- Codex daily rate limit is confirmed hit (HTTP 429 / quota error from `codex-companion.mjs`)
- Task requires interactive multi-turn reasoning that batch CLI cannot handle (e.g. ambiguous spec that needs back-and-forth before any file is touched)

```
Task involves writing/modifying code files?
├── Yes → codex:codex-rescue  (saves Claude tokens, Codex handles file I/O)
│          └── Codex quota hit? → fall back to Claude directly
└── No  → Claude directly     (planning, review, orchestration, git, installs)
```

### context-mode alongside Codex

context-mode MCP tools (`ctx_execute`, `ctx_execute_file`) are **always active** — they are for Claude's own orchestration work, not for Codex runs.

- Claude uses `ctx_execute` for builds, test output, git log, dependency audits
- Codex runs in its own subprocess sandbox; it cannot and does not use context-mode tools
- When Codex daily limit is hit and falling back to Claude: context-mode becomes *more* important to prevent context flooding from large build output

There is no need to disable context-mode when Codex is active. They are orthogonal.

### Model Tiers (Claude fallback)

| Tier | Model | Use Case |
|:---|:---|:---|
| Tier 1 | Opus | Architecture, security, code review, production coding |
| Tier 2 | Inherit | Complex tasks — user chooses model |
| Tier 3 | Sonnet | Docs, testing, debugging, support |
| Tier 4 | Haiku | Fast ops, deployment, simple tasks |

## Microfrontend Setup

The browser always loads the todo remote from `/remotes/todo-app/remoteEntry.js`.

- In local development, `apps/host` rewrites that path to `http://127.0.0.1:3101/remoteEntry.js`
- In production, the host build copies the bundle from `packages/remotes/todo-app/dist/` into `apps/host/public/remotes/todo-app/`

## Development

### JS/TS Tooling

- Package manager: `pnpm` (never `npm install` in a workspace)
- Build: `turbo`
- Lint: `eslint` via `@playground/eslint-config`
- Types: `tsc` via `@playground/tsconfig`
- Markdown: `markdownlint-cli2` (pre-push hook via husky)

### Python Tooling (plugin-eval)

Use the Astral Rust toolchain: `uv`, `ruff`, `ty`. Do not use `pip`, `mypy`, or `black`.

### Adding a Plugin

1. Create `plugins/<name>/` with `.claude-plugin/plugin.json`
2. Add agents in `agents/`, commands in `commands/`, skills in `skills/`
3. Register in `.claude-plugin/marketplace.json`
4. Naming: lowercase, hyphen-separated
5. Validate: `uv run plugin-eval score plugins/<name>/skills/<skill> --depth quick`
