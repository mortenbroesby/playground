---
name: turborepo-workspace-setup
description: "Use this skill when adding a new app or package to the playground monorepo, when configuring Turborepo task pipelines for a new workspace, when wiring up shared configs from @playground/tsconfig or @playground/eslint-config, or when troubleshooting pnpm workspace resolution errors."
version: 1.0.0
---

# Turborepo Workspace Setup

Guides adding new apps and packages to the playground pnpm + Turborepo monorepo, wiring up shared configs, and integrating into the Turbo pipeline.

## Repo Structure

The monorepo uses two workspace globs defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/config/*"   # nested sub-packages (shared configs live here)
```

Key directories:

```
playground/
├── apps/                        # Deployable applications
│   ├── web/
│   └── api/
├── packages/                    # Shared libraries
│   ├── ui/
│   └── config/                  # Shared configuration packages
│       ├── tsconfig/            # @playground/tsconfig
│       └── eslint-config/       # @playground/eslint-config
├── turbo.json                   # Pipeline definitions
└── pnpm-workspace.yaml
```

The `packages/config/*` glob is required because nested directories are not matched by `packages/*` alone. Any shared config package placed one level deeper needs its own glob entry.

---

## Adding an App Workspace

### 1. Create the directory

```bash
mkdir -p apps/my-app/src
```

### 2. Write package.json

```json
{
  "name": "@playground/my-app",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsc --watch --project tsconfig.json",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*",
    "typescript": "catalog:"
  }
}
```

### 3. Write tsconfig.json

```json
{
  "extends": "@playground/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Write .eslintrc.js

```js
module.exports = {
  root: true,
  extends: ["@playground/eslint-config"],
};
```

---

## Adding a Package Workspace

### 1. Create the directory

```bash
mkdir -p packages/my-lib/src
```

### 2. Write package.json

For a shared library, expose the entry point via `main` and `types`. Use `workspace:*` for internal dependencies.

```json
{
  "name": "@playground/my-lib",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsc --watch --project tsconfig.json",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "typescript": "catalog:"
  }
}
```

### 3. Write tsconfig.json

Packages use `"composite": true` to enable TypeScript project references. This allows dependent workspaces to consume declaration files without rebuilding from source.

```json
{
  "extends": "@playground/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Extending Shared Configs

Both `@playground/tsconfig` and `@playground/eslint-config` live under `packages/config/` and are referenced with `workspace:*`.

### TypeScript

`@playground/tsconfig` ships a `base.json` with strict settings and path aliases for the monorepo. Extend it in any workspace:

```json
{ "extends": "@playground/tsconfig/base.json" }
```

Override only the fields that differ per workspace (outDir, lib, jsx, etc.).

### ESLint

`@playground/eslint-config` exports a flat config and a legacy `.eslintrc` preset. For legacy format:

```js
module.exports = {
  root: true,
  extends: ["@playground/eslint-config"],
};
```

Always add `"@playground/eslint-config": "workspace:*"` to the workspace's `devDependencies`.

---

## Turbo Pipeline Integration

Turbo reads `turbo.json` at the repo root. Tasks are defined once and matched to workspaces by script name.

### How `dependsOn` works

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": []
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

- `"^build"` — build all dependencies first (topological order). Use this for `build` and `type-check`.
- `"persistent": true` — long-running task (dev server). Turbo will not wait for it to exit.
- `"cache": false` — skip caching. Use for dev, or tasks with side effects.
- `outputs` — declare what artifacts Turbo should cache and restore. Omit for tasks that produce no files.

New workspaces automatically participate in the pipeline as long as their `package.json` scripts match the task names in `turbo.json`. No edits to `turbo.json` are needed unless the workspace needs custom output paths or special flags.

---

## pnpm Workspace Resolution Gotchas

### ERR_PNPM_WORKSPACE_PKG_NOT_FOUND

```
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND  @playground/my-lib:
This package is found in the workspace but its location doesn't match the workspace pattern.
```

**Cause:** The package directory is not matched by any glob in `pnpm-workspace.yaml`.

**Fix:** Add the required glob. For a package at `packages/config/my-lib`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/config/*"   # add this if missing
```

Then run `pnpm install` to relink.

### Always run pnpm install after adding a workspace

pnpm resolves the workspace graph at install time. Adding a directory and `package.json` does not register the package until `pnpm install` runs. Always execute:

```bash
pnpm install
```

from the repo root before referencing the new workspace from another package.

### workspace:* vs workspace:^ vs exact versions

Use `workspace:*` for internal packages. This resolves to whatever version is in the workspace at install time and is replaced with exact versions on publish. Avoid pinning internal packages to specific version ranges — it causes resolution mismatches during `pnpm install`.

---

## Using Parallel Agents to Scaffold a Workspace

When adding multiple workspaces at once, use the wave-orchestration pattern. Each agent owns a non-overlapping set of files, so they can run simultaneously without conflicts.

Example wave split:

| Agent | Owns |
|-------|------|
| agent-app | `apps/my-app/**` |
| agent-lib | `packages/my-lib/**` |
| agent-config | `packages/config/my-config/**` |

Each agent creates its own `package.json`, `tsconfig.json`, and source files independently. After all agents complete, a single integration step runs `pnpm install` and verifies the build.

See [wave-orchestration skill](../wave-orchestration/SKILL.md) for the full orchestration pattern, including how to define agent boundaries and handle shared-file conflicts.

---

## Validation Checklist

After adding a workspace, confirm it is correctly linked:

```bash
# 1. Resolve workspace graph
pnpm install

# 2. Build all workspaces in dependency order
pnpm turbo build

# 3. Confirm the new workspace appears as a linked package
pnpm ls --depth 1
```

Expected output from `pnpm ls --depth 1` includes `@playground/my-app` or `@playground/my-lib` with its path listed (not a registry URL), confirming pnpm resolved it from the workspace rather than npm.

If `turbo build` skips the new workspace, verify:
- The `package.json` `name` field matches the pattern `@playground/*`
- The `build` script exists and matches the task name in `turbo.json`
- `pnpm install` was run after the directory was created

---

## Related Skills

- [wave-orchestration](../wave-orchestration/SKILL.md) — parallel agent scaffolding pattern for multi-workspace additions
