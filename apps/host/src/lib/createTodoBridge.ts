'use client';

import type { Todo, TodoBridge, TodoDomainEvent, TodoSnapshot, Unsubscribe } from '@playground/types';

const STORAGE_KEY = 'playground.microfrontends.todos.v1';

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const readInitialTodos = (): Todo[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Todo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const reduce = (todos: Todo[], event: TodoDomainEvent): Todo[] => {
  switch (event.type) {
    case 'todo:created':
      return [{ id: createId(), title: event.payload.title, completed: false }, ...todos];
    case 'todo:toggled':
      return todos.map((todo) =>
        todo.id === event.payload.id ? { ...todo, completed: !todo.completed } : todo,
      );
    case 'todo:deleted':
      return todos.filter((todo) => todo.id !== event.payload.id);
    default:
      return todos;
  }
};

export const createTodoBridge = (): TodoBridge => {
  let snapshot: TodoSnapshot = { todos: readInitialTodos(), version: 0 };
  const listeners = new Set<(next: TodoSnapshot) => void>();

  const notify = () => {
    snapshot = { ...snapshot, version: snapshot.version + 1 };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.todos));
    }

    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    getSnapshot: () => snapshot,
    publish: (event: TodoDomainEvent) => {
      snapshot = { ...snapshot, todos: reduce(snapshot.todos, event) };
      notify();
    },
    subscribe: (listener: (next: TodoSnapshot) => void): Unsubscribe => {
      listeners.add(listener);
      listener(snapshot);
      return () => listeners.delete(listener);
    },
  };
};
