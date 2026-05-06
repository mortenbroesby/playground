# Repo-Owned Skills

This directory is the canonical home for repo-owned first-party skills and their
discovery metadata.

## Registry-First Model

- Each repo-owned skill lives in `.skills/<skill-id>/SKILL.md`.
- `SKILL.md` frontmatter is the identity layer (`name`, `description`) and also
  the fallback source of truth for rendering.
- `.skills/.metadata/registry.generated.json` is the deterministic generated
  artifact built from identity frontmatter plus
  `.skills/.metadata/registry.metadata.json`.
- `.skills/.metadata/registry.metadata.json` stores routing/listing metadata for each
  and is the canonical source for ranking signals.
- Runtime adapters and command surfaces should read the generated registry or the
  shared loader helpers, not re-derive routing metadata from markdown prose.

## Required Frontmatter Contract

Each `.skills/<id>/SKILL.md` requires:

- `name` (required)
- `description` (required)

No other top-level keys are currently supported in frontmatter.

## Metadata Contract

`.skills/.metadata/registry.metadata.json` stores per-skill metadata records under
`skills.<skill-id>`:

```json
{
  "version": 1,
  "skills": {
    "frontend-design": {
      "tags": ["ui", "layout"],
      "triggers": ["design review", "visual polish"],
      "anti_triggers": ["api bug"],
      "routing_weight": 1,
      "daily_driver": false,
      "agent_benefit": 4,
      "catalog_group": "specialist",
      "activation_mode": "high-priority-when-relevant"
    }
  }
}
```

Supported metadata fields:

- `tags` (string array)
- `triggers` (string array)
- `anti_triggers` (string array)
- `routing_weight` (number, default `1`)
- `daily_driver` (boolean, default `false`)
- `agent_benefit` (integer 1..5, default `3`)
- `catalog_group` (one of `workflow`, `support`, `specialist`, `imported`;
  default `support`)
- `activation_mode` (one of `default`, `high-priority-when-relevant`,
  `quiet-until-strong-match`, `explicit-only`; default `default`)

Unknown keys in either `SKILL.md` frontmatter or registry metadata fail fast so
typos cannot silently degrade routing.

## Registry Artifact

`.skills/.metadata/registry.generated.json` stores merged identity and catalog
metadata:

- skill id and source location
- display name and description
- `tags`, `triggers`, `anti_triggers`
- `routing_weight`, `daily_driver`, `agent_benefit`, `catalog_group`,
  `activation_mode`

Rebuild or refresh the generated artifact after any identity/metadata edits:

```bash
pnpm skills:registry
```

Verify without writing:

```bash
pnpm skills:registry -- --check
```

Primary command surface:

```bash
pnpm skills:route "find duplicate skills"
pnpm skills:list
pnpm skills:search workflow
```

When adding a new skill, include:

- `name` and `description` in `SKILL.md`
- a matching `.skills/.metadata/registry.metadata.json` `skills.<id>` entry

## Scope Notes

- Checked-in skill files remain the first-party source.
- Content remains out of startup-loaded adapter surfaces.
- `AGENTS.md` is intentionally thin and points agents to these surfaces.
