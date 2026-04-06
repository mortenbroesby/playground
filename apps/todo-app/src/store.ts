import type { Todo } from '@playground/types';

const STORAGE_KEY = 'playground.todos.v1';

function load(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Todo[];
  } catch {
    return [];
  }
}

function save(items: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type Listener = (todos: Todo[]) => void;

const listeners = new Set<Listener>();
let todos: Todo[] = load();

export function getTodos(): Todo[] {
  return todos;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach(l => l(todos));
}

export function addTodo(title: string): void {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
  };
  todos = [...todos, todo];
  save(todos);
  notify();
}

export function toggleTodo(id: string): void {
  todos = todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
  save(todos);
  notify();
}

export function deleteTodo(id: string): void {
  todos = todos.filter(t => t.id !== id);
  save(todos);
  notify();
}

/** Resets in-memory state without touching localStorage. For tests only. */
export function _resetForTest(): void {
  todos = [];
  listeners.clear();
}
