#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createObsidianMemoryMcpServer } from "./mcp-server-core.mjs";

const server = createObsidianMemoryMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
