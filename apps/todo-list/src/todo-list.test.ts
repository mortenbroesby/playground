import { describe, expect, it } from 'vitest';

const calculateRemaining = (values: { completed: boolean }[]) => values.filter((todo) => !todo.completed).length;

describe('todo list helper', () => {
  it('calculates remaining todos', () => {
    expect(calculateRemaining([{ completed: true }, { completed: false }, { completed: false }])).toBe(2);
  });
});
