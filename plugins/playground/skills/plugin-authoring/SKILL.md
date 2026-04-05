---
name: plugin-authoring
description: "Use this skill when creating a new plugin, agent, skill, or command for the claude-agents marketplace. Covers plugin.json structure, agent frontmatter, skill architecture, command definitions, and marketplace.json registration."
version: 1.0.0
---

# Plugin Authoring

A complete guide to building plugins for the claude-agents marketplace — from directory layout to marketplace registration and quality validation.

## When to Use This Skill

- Creating a new plugin from scratch
- Adding an agent, skill, or command to an existing plugin
- Registering components in marketplace.json
- Evaluating plugin quality before publishing
- Debugging PluginEval score regressions

---

## 1. Plugin Structure

Every plugin lives under `plugins/<plugin-name>/` and follows this layout:

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required — declares plugin name
├── agents/                  # Optional — one .md file per agent
│   └── my-agent.md
├── commands/                # Optional — one .md file per command
│   └── my-command.md
└── skills/                  # Optional — one directory per skill
    └── my-skill/
        ├── SKILL.md         # Required
        ├── references/      # Optional — supporting docs
        │   └── deep-dive.md
        └── assets/          # Optional — templates, configs
            └── template.yaml
```

### plugin.json

Only `name` is required. Agents, commands, and skills are **auto-discovered** from the directory structure — no explicit listing needed.

```json
{ "name": "my-plugin" }
```

Optional fields you can add:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Short one-liner for the marketplace listing"
}
```

---

## 2. Agent Frontmatter

Agent files are Markdown files in `agents/`. The frontmatter controls how Claude Code loads and invokes the agent.

### All Fields

```yaml
---
name: agent-name               # Required — lowercase, hyphen-separated
description: "What this agent does. Use PROACTIVELY when [trigger conditions]."
model: opus|sonnet|haiku|inherit  # Required — pick one tier
color: blue|green|red|yellow|cyan|magenta  # Optional — UI accent color
tools: Read, Grep, Glob        # Optional — restrict available tools
---
```

### Valid Example — Security Auditor Agent

```yaml
---
name: security-auditor
description: "Performs static and dynamic security analysis across the codebase. Use PROACTIVELY when touching authentication, authorization, cryptography, or any code that handles user data or external input."
model: opus
color: red
tools: Read, Grep, Glob, Bash
---
```

### Description Rules

- The `description` field is also used by the orchestrator for automatic agent selection.
- It **must** include `"Use PROACTIVELY when"` followed by concrete trigger conditions.
- Keep it under 300 characters — longer descriptions hurt triggering accuracy.

---

## 3. Model Tier Strategy

Match model tier to task complexity and latency requirements.

| Tier | Model | When to Use | Examples |
|------|-------|-------------|---------|
| 1 | `opus` | Architecture decisions, security review, production-grade code generation | security-auditor, architect, code-reviewer |
| 2 | `inherit` | Complex multi-step tasks where the user should control cost | context-manager, data-pipeline-builder |
| 3 | `sonnet` | Documentation, debugging, test generation, support tasks | doc-generator, test-writer, debugger |
| 4 | `haiku` | Fast operations: SEO tags, deployment checks, simple transforms | seo-tagger, config-validator, dep-checker |

**Decision rule:** Default to `sonnet`. Upgrade to `opus` only when the agent makes architectural decisions or reviews security-sensitive code. Drop to `haiku` when latency matters more than depth (e.g., pre-commit hooks, CI steps).

---

## 4. Skill Architecture — Progressive Disclosure

Skills use a three-tier structure so agents load only what they need.

### Tier 1 — SKILL.md (Always Loaded)

The main file. Keep it between 200–600 lines. Include:

- A clear trigger description in frontmatter
- A "When to Use This Skill" section
- Core patterns and the most common code examples

### Tier 2 — references/ (Loaded on Demand)

Detailed reference material that would bloat the main file. Use when:

- The skill has distinct sub-topics each exceeding 150 lines
- You need rubrics, lookup tables, or annotated examples
- Content is useful for reference but not needed on every invocation

Link from SKILL.md with relative paths:

```markdown
See [advanced patterns](references/advanced-patterns.md) for edge cases.
```

### Tier 3 — assets/ (Static Resources)

Non-Markdown files: JSON schemas, YAML templates, shell scripts, configuration starters. Reference from SKILL.md or references/:

```markdown
Starter config: [assets/config-template.yaml](assets/config-template.yaml)
```

### Skill Frontmatter

```yaml
---
name: skill-name               # Required — matches directory name
description: "Use this skill when [specific trigger conditions with context cues]."
---
```

### Valid Example — Skill Frontmatter

```yaml
---
name: stripe-integration
description: "Use this skill when implementing Stripe payments, handling webhooks, managing subscriptions, or debugging payment failures in any backend language."
---
```

---

## 5. Command Frontmatter

Commands live in `commands/` and are invoked as `/command-name [args]` inside Claude Code.

```yaml
---
description: What this command does (shown in /help)
argument-hint: <required-arg> [--optional-flag]
---
```

### Valid Example

```yaml
---
description: Evaluate a plugin or skill for quality
argument-hint: <path> [--depth quick|standard]
---
```

The file body is the prompt that runs when the command is invoked. Use `$ARGUMENTS` to reference what the user typed after the command name.

---

## 6. marketplace.json Registration

The root `.claude-plugin/marketplace.json` is the global registry. Add your plugin as an entry in the `"plugins"` array:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "One-line description for the marketplace listing",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "category": "development"
}
```

### Component Path Conventions

When marketplace tooling or plugin-eval needs explicit component paths:

| Component | Path format |
|-----------|------------|
| Agent | `./agents/agent-name.md` |
| Command | `./commands/command-name.md` |
| Skill | `./skills/skill-name` (directory, **not** `SKILL.md`) |

These paths are relative to the plugin root, not the repo root.

---

## 7. PluginEval Validation

Run quality checks before registering a new plugin. All commands run from `plugins/plugin-eval/`.

```bash
# Fast structural check — < 2 seconds, no LLM calls
uv run plugin-eval score path/to/skill --depth quick --output json

# Full static + LLM judge — ~30 seconds
uv run plugin-eval score path/to/skill --depth standard

# Full certification (all 3 layers including Monte Carlo)
uv run plugin-eval certify path/to/skill

# Compare two versions of a skill
uv run plugin-eval compare path/to/skill-v1 path/to/skill-v2
```

### Badge Thresholds

| Badge | Score |
|-------|-------|
| Platinum | ≥ 90 |
| Gold | ≥ 80 |
| Silver | ≥ 70 |
| Bronze | ≥ 60 |

Aim for Silver or higher before merging. The ten scoring dimensions and their weights:

`triggering_accuracy` (25%) · `orchestration_fitness` (20%) · `output_quality` (15%) · `scope_calibration` (12%) · `progressive_disclosure` (10%) · `token_efficiency` (6%) · `robustness` (5%) · `structural_completeness` (3%) · `code_template_quality` (2%) · `ecosystem_coherence` (2%)

---

## 8. Anti-Patterns to Avoid

These patterns are detected automatically by PluginEval and penalize your score by 5% each, flooring at 50%.

| Anti-Pattern | Definition | Fix |
|---|---|---|
| `OVER_CONSTRAINED` | More than 15 MUST / ALWAYS / NEVER directives | Replace imperative constraints with descriptive guidance |
| `EMPTY_DESCRIPTION` | Frontmatter description under 20 characters | Write a full trigger-based description |
| `MISSING_TRIGGER` | No "Use when…" phrase in description | Add explicit trigger conditions |
| `BLOATED_SKILL` | SKILL.md exceeds 800 lines with no references/ | Move deep content to `references/` subdirectory |
| `ORPHAN_REFERENCE` | A `references/` file is linked but does not exist | Create the file or remove the link |
| `DEAD_CROSS_REF` | A skill cross-references another skill that does not exist | Verify the target path and spelling |

### Constraint Language Check

Before submitting, count instances of "MUST", "ALWAYS", and "NEVER" in your SKILL.md:

```bash
grep -c -iE '\b(MUST|ALWAYS|NEVER)\b' plugins/my-plugin/skills/my-skill/SKILL.md
```

If the count exceeds 15, rewrite those lines to use descriptive language ("prefer", "consider", "typically") instead.

---

## Quick Authoring Checklist

- [ ] `plugins/<name>/.claude-plugin/plugin.json` created with at least `{ "name": "..." }`
- [ ] Agent descriptions include "Use PROACTIVELY when" with concrete triggers
- [ ] Model tier chosen based on task complexity (opus/inherit/sonnet/haiku)
- [ ] Skill SKILL.md is 200–600 lines; deeper content moved to `references/`
- [ ] Command frontmatter has both `description` and `argument-hint`
- [ ] Plugin added to root `.claude-plugin/marketplace.json`
- [ ] `uv run plugin-eval score --depth quick` passes without critical anti-patterns
- [ ] MUST/ALWAYS/NEVER count is 15 or fewer

---

## Related Skills

- [wave-orchestration](../wave-orchestration/SKILL.md) — coordinating multiple agents in parallel waves, useful when your plugin defines agents that collaborate on multi-step workflows
