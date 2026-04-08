import path from 'node:path';
import fs from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

function kanbanApiPlugin(): Plugin {
  const kanbanFile = path.resolve(__dirname, '../../KANBAN.md');

  return {
    name: 'kanban-api',
    configureServer(server) {
      server.watcher.add(kanbanFile);
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === kanbanFile) {
          server.ws.send({
            type: 'custom',
            event: 'kanban:updated',
          });
        }
      });

      server.middlewares.use('/api/kanban', async (req, res, next) => {
        if (req.method === 'GET') {
          const markdown = await fs.readFile(kanbanFile, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ markdown }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';

          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body) as { markdown?: unknown };

              if (typeof parsed.markdown !== 'string') {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing markdown payload' }));
                return;
              }

              await fs.writeFile(kanbanFile, parsed.markdown.endsWith('\n') ? parsed.markdown : `${parsed.markdown}\n`, 'utf8');
              server.ws.send({
                type: 'custom',
                event: 'kanban:updated',
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : 'Failed to save KANBAN.md',
                }),
              );
            }
          });

          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), kanbanApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3010,
    strictPort: true,
    open: true,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 3010,
    strictPort: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
  },
});
