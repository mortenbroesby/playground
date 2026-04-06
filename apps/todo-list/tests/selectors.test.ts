import { describe, expect, it } from 'vitest';

import { sortTodos } from '../src/selectors';

describe('todo-list selectors', () => {
  it('keeps incomplete todos first', () => {
    const sorted = sortTodos([
      { id: '2', title: 'done', completed: true },
      { id: '1', title: 'active', completed: false }
    ]);

    expect(sorted[0]?.id).toBe('1');
  });
});
