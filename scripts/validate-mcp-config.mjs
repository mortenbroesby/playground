import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('mcp/servers.json');
const raw = fs.readFileSync(file, 'utf8');
const parsed = JSON.parse(raw);

if (typeof parsed !== 'object' || parsed === null) {
  throw new Error('mcp/servers.json must contain an object');
}

if (parsed.version !== 1) {
  throw new Error('mcp/servers.json version must be 1');
}

if (!parsed.servers || typeof parsed.servers !== 'object') {
  throw new Error('mcp/servers.json must include a servers object');
}

for (const [name, server] of Object.entries(parsed.servers)) {
  if (!server || typeof server !== 'object') {
    throw new Error(`Server "${name}" must be an object`);
  }

  if (typeof server.command !== 'string' || server.command.length === 0) {
    throw new Error(`Server "${name}" must have a non-empty command string`);
  }

  if (!Array.isArray(server.args) || server.args.some((arg) => typeof arg !== 'string')) {
    throw new Error(`Server "${name}" must have a string[] args field`);
  }

  if (server.env !== undefined) {
    if (typeof server.env !== 'object' || server.env === null) {
      throw new Error(`Server "${name}" env must be an object`);
    }

    for (const [envKey, envValue] of Object.entries(server.env)) {
      if (typeof envKey !== 'string' || typeof envValue !== 'string') {
        throw new Error(`Server "${name}" env must contain string key/value entries`);
      }
    }
  }
}

console.log(`MCP config is valid (${Object.keys(parsed.servers).length} servers)`);
