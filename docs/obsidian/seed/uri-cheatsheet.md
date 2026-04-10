---
type: utility
utility: obsidian-uri-cheatsheet
generated_on: __GENERATED_ON__
tags:
  - utility
---

# Obsidian URI Cheatsheet

These links assume:

- vault: `__VAULT_NAME__`
- repo note: `02 Repositories/__REPO_SLUG__/00 Repo Home`

## Navigation

- [Open repo home](obsidian://advanced-uri?vault=__VAULT_NAME_ENCODED__&filepath=__REPO_HOME_PATH_ENCODED__)
- [Jump to Next Actions](obsidian://advanced-uri?vault=__VAULT_NAME_ENCODED__&filepath=__REPO_HOME_PATH_ENCODED__&heading=Next%20Actions)
- [Open repository index](obsidian://advanced-uri?vault=__VAULT_NAME_ENCODED__&filepath=01%20Dashboard%2FRepository%20Index)

## Daily append

- [Append a worklog bullet to today's daily note](obsidian://advanced-uri?vault=__VAULT_NAME_ENCODED__&daily=true&mode=append&data=__DAILY_APPEND_ENCODED__)

## Terminal example

```bash
open "obsidian://advanced-uri?vault=__VAULT_NAME_ENCODED__&filepath=__REPO_HOME_PATH_ENCODED__"
```
