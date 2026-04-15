import path from 'node:path';
import fs from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
import { ensureTaskFile, parseKanbanDocument, serializeKanban, serializeTaskNote } from './src/lib/kanban';
import type { KanbanPriority, KanbanSection, KanbanSectionName } from './src/types';

function kanbanApiPlugin(): Plugin {
  const kanbanFile = path.resolve(
    __dirname,
    '../../vault/00 Repositories/playground/04 Tasks/Task Board.md',
  );
  const tasksDir = path.resolve(
    __dirname,
    '../../vault/00 Repositories/playground/04 Tasks/tasks',
  );

  async function listTaskFiles() {
    try {
      const entries = await fs.readdir(tasksDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async function readTaskNotes(taskFiles: string[]) {
    const notes = await Promise.all(
      taskFiles.map(async (taskFile) => {
        const relativeTaskFile = `tasks/${taskFile}`;
        const markdown = await fs.readFile(path.join(tasksDir, taskFile), 'utf8');
        return [relativeTaskFile, markdown] as const;
      }),
    );

    return Object.fromEntries(notes);
  }

  async function readBoardDocument() {
    const markdown = await fs.readFile(kanbanFile, 'utf8');
    const taskFiles = await listTaskFiles();
    const taskNotes = await readTaskNotes(taskFiles);
    return parseKanbanDocument(markdown, taskNotes);
  }

  function isPriority(value: unknown): value is KanbanPriority {
    return value === 'P0' || value === 'P1' || value === 'P2' || value === 'P3';
  }

  function isSectionName(value: unknown): value is KanbanSectionName {
    return value === 'Backlog' || value === 'Ready' || value === 'In Progress' || value === 'Done';
  }

  function normalizeTask(input: unknown, section: KanbanSectionName) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid task payload');
    }

    const task = input as Record<string, unknown>;

    if (typeof task.id !== 'string' || typeof task.title !== 'string') {
      throw new Error('Task payload is missing id or title');
    }

    if (!isPriority(task.priority)) {
      throw new Error(`Task ${task.title} has an invalid priority`);
    }

    const normalizedSection = isSectionName(task.section) ? task.section : section;

    return {
      id: task.id,
      title: task.title.trim(),
      priority: task.priority,
      section: normalizedSection,
      aiAppetite: typeof task.aiAppetite === 'number' ? task.aiAppetite : undefined,
      why: typeof task.why === 'string' ? task.why.trim() || undefined : undefined,
      outcome: typeof task.outcome === 'string' ? task.outcome.trim() || undefined : undefined,
      source: typeof task.source === 'string' ? task.source.trim() || undefined : undefined,
      details: typeof task.details === 'string' ? task.details.trim() || undefined : undefined,
      taskFile: typeof task.taskFile === 'string' ? task.taskFile : undefined,
      isCustom: Boolean(task.isCustom),
    };
  }

  function normalizeSections(input: unknown): KanbanSection[] {
    if (!Array.isArray(input)) {
      throw new Error('Missing sections payload');
    }

    return input.map((section) => {
      if (!section || typeof section !== 'object') {
        throw new Error('Invalid section payload');
      }

      const rawSection = section as Record<string, unknown>;

      if (!isSectionName(rawSection.name)) {
        throw new Error('Invalid section name');
      }

      if (!Array.isArray(rawSection.tasks)) {
        throw new Error(`Section ${rawSection.name} is missing tasks`);
      }

      return {
        name: rawSection.name,
        tasks: rawSection.tasks.map((task) =>
          normalizeTask(task, rawSection.name as KanbanSectionName),
        ),
      };
    });
  }

  async function writeBoardDocument(sections: KanbanSection[]) {
    const currentDocument = await readBoardDocument();
    const existingTaskFiles = new Set(
      currentDocument.sections.flatMap((section) =>
        section.tasks.map((task) => task.taskFile).filter((value): value is string => Boolean(value)),
      ),
    );
    const nextTaskFiles = new Set<string>();

    await fs.mkdir(tasksDir, { recursive: true });

    for (const section of sections) {
      for (const task of section.tasks) {
        const taskFile = ensureTaskFile(task);
        task.taskFile = taskFile;
        nextTaskFiles.add(taskFile);
        await fs.writeFile(path.join(tasksDir, path.basename(taskFile)), serializeTaskNote(task), 'utf8');
      }
    }

    for (const taskFile of existingTaskFiles) {
      if (nextTaskFiles.has(taskFile)) {
        continue;
      }

      await fs.rm(path.join(tasksDir, path.basename(taskFile)), { force: true });
    }

    await fs.writeFile(kanbanFile, serializeKanban(currentDocument.preamble, sections), 'utf8');
  }

  return {
    name: 'kanban-api',
    configureServer(server) {
      server.watcher.add(kanbanFile);
      server.watcher.add(tasksDir);
      server.watcher.on('change', (file) => {
        const resolvedFile = path.resolve(file);
        if (resolvedFile === kanbanFile || resolvedFile.startsWith(`${tasksDir}${path.sep}`)) {
          server.ws.send({
            type: 'custom',
            event: 'kanban:updated',
          });
        }
      });

      server.middlewares.use('/api/kanban', async (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ document: await readBoardDocument() }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';

          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body) as {
                document?: {
                  sections?: unknown;
                };
              };

              await writeBoardDocument(normalizeSections(parsed.document?.sections));
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
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Failed to save the vault task board',
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
    testTimeout: 15000,
  },
});
