import { describe, expect, it } from 'vitest';

const computeStats = (values: { completed: boolean }[]) => {
  const total = values.length;
  const completed = values.filter((todo) => todo.completed).length;
  return { total, completed, remaining: total - completed };
};

describe('todo stats helper', () => {
  it('returns total, completed, and remaining', () => {
    expect(computeStats([{ completed: true }, { completed: false }])).toEqual({
      total: 2,
      completed: 1,
      remaining: 1,
    });
  });
});
