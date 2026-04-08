---
name: git-worktree
description: Manage Git worktrees to work on multiple branches simultaneously without stashing or context-switching. Use when you need to run a hotfix, review a PR, or spike a feature while keeping your main working directory clean.
---

# Git Worktree

Work on multiple branches at the same time, each in its own directory, sharing a single `.git` object store.

## When to Use This Skill

- Applying an urgent hotfix without disturbing work-in-progress
- Reviewing or testing a PR branch alongside your current branch
- Running a long build/test suite on one branch while developing on another
- Isolating an experiment without stashing or committing half-finished work
- Running multiple dev servers from different branches simultaneously

## Core Commands

```bash
# List all worktrees
git worktree list

# Add a worktree for an existing branch
git worktree add ../project-feature feature/my-feature

# Add a worktree AND create a new branch from HEAD
git worktree add -b hotfix/critical ../project-hotfix

# Add a worktree AND create a new branch from a specific base
git worktree add -b hotfix/critical ../project-hotfix main

# Remove a worktree (must not be the main one)
git worktree remove ../project-feature

# Remove a worktree even if it has untracked files (use with care)
git worktree remove --force ../project-feature

# Prune stale worktree metadata (after manually deleting directories)
git worktree prune
```

## Typical Workflow: Urgent Hotfix

```bash
# You're mid-feature on main; a critical bug needs fixing now.

# 1. Create a hotfix worktree from the release branch
git worktree add -b hotfix/login-crash ../app-hotfix release/1.4

# 2. Go fix it
cd ../app-hotfix
# ... edit, commit ...

# 3. Return to feature work immediately
cd ../app-main
# No stash, no branch switch — your feature state is untouched.

# 4. Merge the hotfix however your workflow demands
git cherry-pick hotfix/login-crash   # or open a PR

# 5. Clean up
git worktree remove ../app-hotfix
git branch -d hotfix/login-crash
```

## Typical Workflow: Review a PR Locally

```bash
# Fetch the PR branch without switching your working directory
git fetch origin pull/42/head:pr-42
git worktree add ../app-pr42 pr-42

cd ../app-pr42
# Run tests, start dev server, etc.
# Your main branch dev server can stay running.

# Clean up when done
cd ../app-main
git worktree remove ../app-pr42
git branch -d pr-42
```

## Rules & Constraints

- **One checkout per branch**: a branch can only be checked out in one worktree at a time. Git will refuse to add a worktree for an already-checked-out branch.
- **Shared object store**: all worktrees share `.git/` — commits and refs are instantly visible across them.
- **Path conventions**: put sibling worktrees *outside* the main repo directory (e.g., `../app-feature`) to avoid confusing tools that glob recursively.
- **Prune often**: if you delete a worktree directory manually without `git worktree remove`, run `git worktree prune` to clean up stale metadata.

## Monorepo / pnpm Considerations

When adding a worktree in a pnpm monorepo (like this repo), the worktree directory won't have `node_modules` installed. After creating the worktree:

```bash
cd ../app-feature
pnpm install   # installs into the new worktree
```

If you only need to build or lint a single workspace, use filtered commands to avoid a full install:

```bash
pnpm --filter @playground/host build
```

## Verification

After adding a worktree, confirm the setup looks correct:

```bash
git worktree list
# Expected output:
# /path/to/app-main       abc1234 [main]
# /path/to/app-feature    def5678 [feature/my-feature]
```

After removing:

```bash
git worktree list
# Only the main worktree should remain.
```

## Common Pitfalls

- **Forgetting to prune**: orphaned worktree metadata accumulates; run `git worktree prune` periodically.
- **Checking out the same branch twice**: Git blocks this — create a new branch instead (`-b`).
- **Nested worktrees**: don't place worktrees inside the main repo directory; glob-based tools will pick them up unexpectedly.
- **Missing node_modules**: worktrees are bare directory clones — always run `pnpm install` in a new worktree before running dev commands.
