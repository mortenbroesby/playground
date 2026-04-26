# Braindump

Use this file for raw ideas before they become tasks in [KANBAN.md](/Users/macbook/personal/playground/KANBAN.md).

Keep this file loose:

- half-formed ideas are fine
- duplicates should be cleaned up when an idea moves into `KANBAN.md`
- if an idea is already task-shaped, it probably belongs in `KANBAN.md` instead

## Example

- Add a tiny "new post" note on the home page when writing is updated.

## Braindump Inbox

### Ideas

- Maybe we use rxjs? streaming? consider what could make our MCP server and logic fast and efficient.

- Consider adopting:
  - `"@biomejs/biome": "2.4.10"`
  - <https://www.npmjs.com/package/@msgpack/msgpack>
  - <https://www.npmjs.com/package/ci-npm-update>

- I would like to be able to release ai-context-engine to npm in an alpha
  state, and then use the npm module in our repository. For that, we need a
  spec. We need to mature the library enough to be able to release. For
  example, i want the observability server to be optional. I want a config file
  we can read at the root of the repo, if installed in a repo.

- Can we bind our ai context engine observability server to a url? So people
  can remember it. I believe there are free options we can leverage.

### "TODOs"

- Pull in relevant setup from superpowers.
- Add unit tests for our hooks.
- Setup smth like <https://github.com/cfngc4594/agent-notify>
- Consider how we could use <https://github.com/tree-sitter/tree-sitter>
- Checkout <https://github.com/GlitterKill/sdl-mcp> and compare with
  `ai-context-engine`
- Look into <https://stryker-mutator.io/docs/> mutation testing.
- <https://github.com/AgentSeal/codeburn> for checking token usage % analytics
- workspace-tools
- Standardize local HTTP server startup across the repo so dev/agent-facing
  servers auto-discover an open port in the `34323-35322` range when the
  preferred port is busy, instead of failing startup.

- Look at how they do RAG here.
- <https://github.com/VoltAgent/voltagent>
- <https://github.com/mastra-ai/mastra>

- Revisit `How I Built This Website` as a reinvented post for the current site and stack, instead of keeping the older archived version live.
