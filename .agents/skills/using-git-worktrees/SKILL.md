---
name: using-git-worktrees
description: Use when starting implementation work that needs isolation from the current workspace. Creates an external sibling worktree from latest main, starts agents inside it, and removes the worktree when finished.
---

# Using git worktrees

## Overview

Git worktrees create isolated working directories that share the same
repository history. Use them to keep agent work completely separate from the
current checkout.

**Core principle:** Worktrees live outside the repo, start from latest `main`,
and are removed when the task is done.

**Announce at start:**

```text
I'm using the using-git-worktrees skill to set up an isolated external workspace.
```

## Directory convention

Worktrees must live in a sibling directory next to the repository, not inside
it.

If the repository is:

```bash
/path/to/playground
```

Then worktrees live under:

```bash
/path/to/playground.worktrees
```

Example worktree path:

```bash
/path/to/playground.worktrees/feature-auth
```

This keeps the worktree folder airgapped from the main repository checkout.

## Start workflow

### 1. Detect repo root and project name

```bash
repo_root="$(git rev-parse --show-toplevel)"
project="$(basename "$repo_root")"
parent_dir="$(dirname "$repo_root")"
worktrees_root="$parent_dir/$project.worktrees"
```

### 2. Check that the current checkout is safe

Before switching branches or pulling, check whether the current repository has
uncommitted changes:

```bash
git status --short
```

If there are uncommitted changes, do **not** switch branches. Report the dirty
state and ask how to proceed.

### 3. Ensure latest main

From the original repository:

```bash
cd "$repo_root"
git fetch origin main
git checkout main
git pull --ff-only origin main
```

### 4. Create the external worktrees directory

```bash
mkdir -p "$worktrees_root"
```

No `.gitignore` verification is needed because the directory is outside the
repository.

### 5. Create a worktree from latest main

Use a clear branch name for the task.

```bash
branch_name="feature/<task-name>"
worktree_name="$(echo "$branch_name" | tr '/' '-')"
worktree_path="$worktrees_root/$worktree_name"

git worktree add -b "$branch_name" "$worktree_path" origin/main
cd "$worktree_path"
```

If the branch already exists, use:

```bash
git worktree add "$worktree_path" "$branch_name"
```

Only reuse an existing branch if that is intentional.

## Project setup

Run setup inside the new worktree:

```bash
cd "$worktree_path"
```

Auto-detect common ecosystems:

```bash
# Node.js
if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ]; then
    pnpm install
  elif [ -f yarn.lock ]; then
    yarn install
  elif [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

# Rust
if [ -f Cargo.toml ]; then
  cargo build
fi

# Python
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

if [ -f pyproject.toml ] && command -v poetry >/dev/null 2>&1; then
  poetry install
fi

# Go
if [ -f go.mod ]; then
  go mod download
fi
```

## Baseline verification

Run the project's normal validation command before making changes.

Examples:

```bash
npm test
pnpm test
yarn test
cargo test
pytest
go test ./...
```

If tests fail, report the failure and do not continue implementation without
explicit approval.

## Agent startup

Agents must start inside the external worktree:

```bash
cd "$worktree_path"
```

Before beginning work, confirm:

```bash
pwd
git branch --show-current
git status --short
```

Expected:

- `pwd` is inside `<repo-name>.worktrees/...`
- branch is the task branch
- status is clean before changes begin

## Completion workflow

When the task is done, the agent should leave the worktree clean or
intentionally committed.

### 1. Check status

```bash
cd "$worktree_path"
git status --short
```

If there are uncommitted changes, either commit them, discard them, or ask what
to do.

### 2. Return to the original repo

```bash
cd "$repo_root"
```

### 3. Remove the worktree

```bash
git worktree remove "$worktree_path"
```

If Git says the worktree contains changes, do not force-remove unless the user
explicitly confirms.

### 4. Prune stale metadata

```bash
git worktree prune
```

### 5. Optionally remove empty root folder

```bash
rmdir "$worktrees_root" 2>/dev/null || true
```

## Quick reference

| Situation | Action |
| --- | --- |
| Repo is `playground` | Use sibling `playground.worktrees` |
| Need new task branch | Create from `origin/main` |
| Main is outdated | Fetch and fast-forward first |
| Current repo has dirty changes | Stop before checkout or pull |
| Worktree path would be inside repo | Do not proceed |
| Baseline tests fail | Report and ask before implementation |
| Task is finished | Remove worktree and prune |
| Worktree has uncommitted changes | Do not remove without approval |

## Common mistakes

### Creating `.worktrees` inside the repo

Do not create project-local worktrees. Use a sibling folder:

```bash
../<repo-name>.worktrees
```

### Branching from stale main

Always fetch and create the worktree from latest `origin/main`.

### Starting agents in the original repo

Agents must work inside the external worktree only.

### Leaving worktrees behind

When finished, remove the worktree with:

```bash
git worktree remove "$worktree_path"
git worktree prune
```

## Example workflow

```bash
repo_root="$(git rev-parse --show-toplevel)"
project="$(basename "$repo_root")"
parent_dir="$(dirname "$repo_root")"
worktrees_root="$parent_dir/$project.worktrees"

cd "$repo_root"
git status --short
git fetch origin main
git checkout main
git pull --ff-only origin main

branch_name="feature/auth-flow"
worktree_name="$(echo "$branch_name" | tr '/' '-')"
worktree_path="$worktrees_root/$worktree_name"

mkdir -p "$worktrees_root"
git worktree add -b "$branch_name" "$worktree_path" origin/main

cd "$worktree_path"
npm ci
npm test
```

Report:

```text
Worktree ready at /path/to/playground.worktrees/feature-auth-flow
Branch: feature/auth-flow
Base: latest origin/main
Baseline tests passing
Ready to implement auth flow
```

Cleanup:

```bash
cd /path/to/playground
git worktree remove /path/to/playground.worktrees/feature-auth-flow
git worktree prune
```

## Red flags

Never:

- Create worktrees inside the repository
- Start from stale local `main`
- Work from the original checkout
- Remove a dirty worktree without explicit approval
- Skip baseline verification

Always:

- Use sibling `<repo-name>.worktrees`
- Fetch latest `origin/main`
- Create the task branch from latest main
- Start agents inside the worktree
- Remove the worktree when finished
