# MCP configuration

This folder defines a shared MCP server catalog for local AI tooling (Codex, Copilot-compatible MCP clients, Cursor, Claude, etc.) using **pnpm**-based commands only.

## Files
- `servers.json`: canonical server catalog for this repo

## Validate
```bash
pnpm mcp:validate
```

## Export client snippets
```bash
pnpm mcp:export:claude
pnpm mcp:export:cursor
pnpm mcp:export:vscode
```

These commands print JSON snippets you can paste into each client's MCP settings file.

## Recommended environment variables
- `GITHUB_TOKEN` for GitHub MCP server
- `DATABASE_URL` for Postgres MCP server

## Why this setup
- Single source of truth for MCP servers across tools/platforms
- `pnpm dlx` keeps setup lightweight and package-manager consistent
- Easy validation in CI/local checks
