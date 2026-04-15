import { describe, expect, it } from 'vitest';
import {
  ensureTaskFile,
  parseKanbanDocument,
  parseTaskNote,
  serializeKanban,
  serializeTaskNote,
} from '../src/lib/kanban';

describe('task board parser', () => {
  it('parses task-note details from the tasks folder and groups them by status', () => {
    const board = `# Task Board

## Scales

Priority scale.
`;

    const taskNotes = {
      'tasks/add-board-index.md': `---
type: repo-task
repo: playground
id: add-board-index
priority: P1
status: Ready
ai_appetite: 70
source: "seeded todo"
---

# Add board index

## Why

Keep the board lightweight.

## Outcome

Split summaries from rich notes.

## Details

### Scope

- Preserve the scales section
- Keep task details in note files
`,
    };

    const document = parseKanbanDocument(board, taskNotes);
    const task = document.sections[1].tasks[0];

    expect(task).toMatchObject({
      title: 'Add board index',
      priority: 'P1',
      section: 'Ready',
      aiAppetite: 70,
      taskFile: 'tasks/add-board-index.md',
      why: 'Keep the board lightweight.',
      outcome: 'Split summaries from rich notes.',
      source: 'seeded todo',
    });
    expect(task.details).toContain('### Scope');
  });

  it('serializes the board without dropping non-lane sections', () => {
    const board = `# Task Board

## Scales

Priority scale.
`;

    const document = parseKanbanDocument(board, {
      'tasks/add-board-index.md': `# Add board index`,
    });
    const next = serializeKanban(document.preamble, document.sections);

    expect(next).toContain('## Scales');
    expect(next).not.toContain('Task: [Add board index](tasks/add-board-index.md)');
    expect(next).not.toContain('## Done');
  });

  it('serializes task notes with a freeform details section', () => {
    const markdown = serializeTaskNote({
      id: 'task-a',
      title: 'Big task',
      priority: 'P1',
      section: 'Backlog',
      aiAppetite: 80,
      source: 'architecture review',
      why: 'Because the current shape is lossy.',
      outcome: 'Because the board becomes safe to edit.',
      details: `Spec-driven reconstruction.

### Scope

- Parse the board
- Persist task files`,
      taskFile: 'tasks/big-task.md',
    });

    const parsed = parseTaskNote(markdown);

    expect(parsed.why).toBe('Because the current shape is lossy.');
    expect(parsed.outcome).toBe('Because the board becomes safe to edit.');
    expect(parsed.details).toContain('### Scope');
    expect(parsed.source).toBe('architecture review');
    expect(markdown).toContain('type: repo-task');
    expect(markdown).toContain('priority: P1');
    expect(markdown).toContain('status: Backlog');
    expect(markdown).toContain('ai_appetite: 80');
  });

  it('derives a task-file path when a new task does not have one yet', () => {
    expect(
      ensureTaskFile({
        id: 'custom-1',
        title: 'Fresh board idea',
        priority: 'P2',
        section: 'Ready',
      }),
    ).toBe('tasks/fresh-board-idea.md');
  });

  it('remains backward-compatible with legacy non-frontmatter task notes', () => {
    const parsed = parseTaskNote(`# Legacy task

Priority: \`P1\`
Status: \`Ready\`
AI Appetite: 60%
Source: seeded todo

## Why

Keep older notes readable.
`);

    expect(parsed).toMatchObject({
      title: 'Legacy task',
      priority: 'P1',
      section: 'Ready',
      aiAppetite: 60,
      source: 'seeded todo',
      why: 'Keep older notes readable.',
    });
  });
});
