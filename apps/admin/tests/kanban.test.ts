import { describe, expect, it } from 'vitest';
import { parseKanban, parseKanbanDocument, serializeKanban } from '../src/lib/kanban';

describe('parseKanban', () => {
  it('parses sectioned tasks with metadata', () => {
    const markdown = `# Kanban

## In Progress

- [ ] \`P0\` Ship the thing
  AI Appetite: 80%
  Why: it matters
  Outcome: it lands
  Source: test

## Done

- [x] \`P2\` Wrap up cleanup
  AI Appetite: 55%
  Why: less drift
`;

    const sections = parseKanban(markdown);

    expect(sections[2].name).toBe('In Progress');
    expect(sections[2].tasks).toHaveLength(1);
    expect(sections[2].tasks[0]).toMatchObject({
      title: 'Ship the thing',
      priority: 'P0',
      section: 'In Progress',
      aiAppetite: 80,
      why: 'it matters',
      outcome: 'it lands',
      source: 'test',
    });

    expect(sections[3].name).toBe('Done');
    expect(sections[3].tasks[0]).toMatchObject({
      title: 'Wrap up cleanup',
      priority: 'P2',
      aiAppetite: 55,
      section: 'Done',
    });
  });

  it('keeps the canonical section order even when a section has no tasks', () => {
    const sections = parseKanban('## Ready\n\n- `P1` Add board');
    expect(sections.map((section) => section.name)).toEqual([
      'Backlog',
      'Ready',
      'In Progress',
      'Done',
    ]);
    expect(sections[1].tasks).toHaveLength(1);
    expect(sections[0].tasks).toHaveLength(0);
  });

  it('serializes sections back into the kanban markdown shape', () => {
    const source = `# Kanban

Intro copy.

## Ready

- [ ] \`P1\` Add board
  AI Appetite: 70%
  Why: good
`;

    const document = parseKanbanDocument(source);
    const next = serializeKanban(document.preamble, document.sections);

    expect(next).toContain('# Kanban');
    expect(next).toContain('## Ready');
    expect(next).toContain('- `P1` Add board');
    expect(next).toContain('  AI Appetite: 70%');
    expect(next).toContain('  Why: good');
    expect(next).toContain('## Done');
  });
});
