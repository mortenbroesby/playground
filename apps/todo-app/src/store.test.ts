import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTodos, addTodo, toggleTodo, deleteTodo, subscribe, _resetForTest } from './store';

beforeEach(() => {
  localStorage.clear();
  _resetForTest();
});

describe('addTodo', () => {
  it('adds a todo with the given title', () => {
    addTodo('Buy milk');
    expect(getTodos()).toHaveLength(1);
    expect(getTodos()[0].title).toBe('Buy milk');
    expect(getTodos()[0].completed).toBe(false);
    expect(typeof getTodos()[0].id).toBe('string');
  });

  it('trims whitespace from title', () => {
    addTodo('  Buy milk  ');
    expect(getTodos()[0].title).toBe('Buy milk');
  });

  it('persists to localStorage', () => {
    addTodo('Buy milk');
    const stored = JSON.parse(localStorage.getItem('playground.todos.v1') ?? '[]') as { title: string }[];
    expect(stored[0].title).toBe('Buy milk');
  });
});

describe('toggleTodo', () => {
  it('marks an incomplete todo as completed', () => {
    addTodo('Buy milk');
    const id = getTodos()[0].id;
    toggleTodo(id);
    expect(getTodos()[0].completed).toBe(true);
  });

  it('marks a completed todo back to incomplete', () => {
    addTodo('Buy milk');
    const id = getTodos()[0].id;
    toggleTodo(id);
    toggleTodo(id);
    expect(getTodos()[0].completed).toBe(false);
  });
});

describe('deleteTodo', () => {
  it('removes the todo with the given id', () => {
    addTodo('Buy milk');
    const id = getTodos()[0].id;
    deleteTodo(id);
    expect(getTodos()).toHaveLength(0);
  });

  it('leaves other todos intact', () => {
    addTodo('A');
    addTodo('B');
    const idA = getTodos()[0].id;
    deleteTodo(idA);
    expect(getTodos()).toHaveLength(1);
    expect(getTodos()[0].title).toBe('B');
  });
});

describe('subscribe', () => {
  it('calls listener with current todos when they change', () => {
    const listener = vi.fn();
    subscribe(listener);
    addTodo('Buy milk');
    expect(listener).toHaveBeenCalledWith(getTodos());
  });

  it('stops calling listener after unsubscribe', () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);
    unsub();
    addTodo('Buy milk');
    expect(listener).not.toHaveBeenCalled();
  });
});
