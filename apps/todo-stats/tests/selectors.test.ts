import { describe, expect, it } from 'vitest';

import { getTodoStats } from '../src/selectors';

describe('todo-stats selectors', () => {
  it('computes total, completed, and remaining', () => {
    const stats = getTodoStats([
      { id: '1', title: 'a', completed: false },
      { id: '2', title: 'b', completed: true }
    ]);

    expect(stats).toEqual({ total: 2, completed: 1, remaining: 1 });
  });
});
