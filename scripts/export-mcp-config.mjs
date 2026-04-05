import fs from 'node:fs';
import path from 'node:path';

const client = process.argv[2];

if (!client) {
  console.error('Usage: node scripts/export-mcp-config.mjs <claude|cursor|vscode>');
  process.exit(1);
}

const file = path.resolve('mcp/servers.json');
const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
const servers = parsed.servers ?? {};

const formatForClient = (target) => {
  if (target === 'claude') {
    return { mcpServers: servers };
  }

  if (target === 'cursor') {
    return { mcpServers: servers };
  }

  if (target === 'vscode') {
    return { mcp: { servers } };
  }

  throw new Error(`Unsupported client: ${target}`);
};

const output = formatForClient(client);
console.log(JSON.stringify(output, null, 2));
