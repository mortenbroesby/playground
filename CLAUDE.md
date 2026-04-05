# Project: playground

A pnpm + Turborepo monorepo playground for experimenting with multi-agent Claude Code workflows.
Houses the claude-agents plugin marketplace alongside shared packages and apps.

## Repository Structure

```
playground/
├── .claude-plugin/marketplace.json   # Registry of all plugins
├── apps/
│   └── claude-agents/                # Plugin marketplace (75 plugins, 182 agents, 147 skills)
│       ├── plugins/
│       ├── docs/
│       └── tools/
├── packages/
│   ├── ui/                           # @playground/ui — shared React component library
│   └── config/                       # @playground/config — shared ESLint + TSConfig
│       ├── tsconfig/                 # @playground/tsconfig
│       └── eslint/                   # @playground/eslint-config
├── plugins/                          # Claude Code plugins (root-level for marketplace)
│   └── playground/                   # Skills specific to this repo
├── docs/superpowers/                 # Specs and implementation plans
├── turbo.json                        # Turborepo pipeline
└── pnpm-workspace.yaml               # Workspace globs: apps/*, packages/*, packages/config/*
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

## Model Tiers

| Tier | Model | Use Case |
|:---|:---|:---|
| Tier 1 | Opus | Architecture, security, code review, production coding |
| Tier 2 | Inherit | Complex tasks — user chooses model |
| Tier 3 | Sonnet | Docs, testing, debugging, support |
| Tier 4 | Haiku | Fast ops, deployment, simple tasks |

## PluginEval

Three-layer evaluation in `apps/claude-agents/plugins/plugin-eval/`.

```bash
cd apps/claude-agents/plugins/plugin-eval

uv run plugin-eval score path/to/skill --depth quick     # static only, instant
uv run plugin-eval score path/to/skill --depth standard  # + LLM judge
uv run plugin-eval certify path/to/skill                 # full certification
```

Badges: Platinum ≥90, Gold ≥80, Silver ≥70, Bronze ≥60

Anti-patterns: `OVER_CONSTRAINED` `EMPTY_DESCRIPTION` `MISSING_TRIGGER` `BLOATED_SKILL` `ORPHAN_REFERENCE` `DEAD_CROSS_REF`

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
