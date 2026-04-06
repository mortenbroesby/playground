import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTodoStore } from './store';

beforeEach(() => {
  localStorage.clear();
});

describe('addTodo', () => {
  it('adds a todo with the given title', () => {
    const store = createTodoStore();
    store.addTodo('Buy milk');
    expect(store.getTodos()).toHaveLength(1);
    expect(store.getTodos()[0].title).toBe('Buy milk');
    expect(store.getTodos()[0].completed).toBe(false);
    expect(typeof store.getTodos()[0].id).toBe('string');
  });

  it('trims whitespace from title', () => {
    const store = createTodoStore();
    store.addTodo('  Buy milk  ');
    expect(store.getTodos()[0].title).toBe('Buy milk');
  });

  it('persists to localStorage', () => {
    const store = createTodoStore();
    store.addTodo('Buy milk');
    const stored = JSON.parse(localStorage.getItem('playground.todos.v1') ?? '[]') as { title: string }[];
    expect(stored[0].title).toBe('Buy milk');
  });
});

describe('toggleTodo', () => {
  it('marks an incomplete todo as completed', () => {
    const store = createTodoStore();
    store.addTodo('Buy milk');
    const id = store.getTodos()[0].id;
    store.toggleTodo(id);
    expect(store.getTodos()[0].completed).toBe(true);
  });

  it('marks a completed todo back to incomplete', () => {
    const store = createTodoStore();
    store.addTodo('Buy milk');
    const id = store.getTodos()[0].id;
    store.toggleTodo(id);
    store.toggleTodo(id);
    expect(store.getTodos()[0].completed).toBe(false);
  });
});

describe('deleteTodo', () => {
  it('removes the todo with the given id', () => {
    const store = createTodoStore();
    store.addTodo('Buy milk');
    const id = store.getTodos()[0].id;
    store.deleteTodo(id);
    expect(store.getTodos()).toHaveLength(0);
  });

  it('leaves other todos intact', () => {
    const store = createTodoStore();
    store.addTodo('A');
    store.addTodo('B');
    const idA = store.getTodos()[0].id;
    store.deleteTodo(idA);
    expect(store.getTodos()).toHaveLength(1);
    expect(store.getTodos()[0].title).toBe('B');
  });
});

describe('subscribe', () => {
  it('calls listener with current todos when they change', () => {
    const store = createTodoStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.addTodo('Buy milk');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops calling listener after unsubscribe', () => {
    const store = createTodoStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.addTodo('Buy milk');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('host controls', () => {
  it('replaces todos from the host side', () => {
    const store = createTodoStore();
    store.replaceTodos([{ id: 'host-1', title: 'Seeded', completed: true }]);
    expect(store.getTodos()).toEqual([{ id: 'host-1', title: 'Seeded', completed: true }]);
  });

  it('emits structured events back to the host', () => {
    const onEvent = vi.fn();
    const store = createTodoStore({ onEvent });
    store.addTodo('Buy milk');

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'todo:added',
        snapshot: expect.objectContaining({
          todos: expect.arrayContaining([expect.objectContaining({ title: 'Buy milk' })]),
        }),
      }),
    );
  });
});
