import type { Todo } from '@playground/types';
import type { TodoAppEvent, TodoAppMountOptions, TodoAppSnapshot } from './contracts';

const STORAGE_KEY = 'playground.todos.v1';

function sanitizeTodos(items: Todo[]): Todo[] {
  return items
    .map((item) => ({
      ...item,
      title: item.title.trim(),
    }))
    .filter((item) => item.title.length > 0);
}

function load(initialTodos?: Todo[]): Todo[] {
  if (initialTodos) {
    return sanitizeTodos(initialTodos);
  }

  try {
    return sanitizeTodos(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Todo[]);
  } catch {
    return [];
  }
}

function save(items: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type Listener = () => void;

/* eslint-disable no-unused-vars */
export type TodoStore = {
  getSnapshot(): TodoAppSnapshot;
  getTodos(): Todo[];
  subscribe(listener: Listener): () => void;
  addTodo(title: string): void;
  toggleTodo(id: string): void;
  deleteTodo(id: string): void;
  replaceTodos(items: Todo[]): void;
  clearTodos(): void;
  emitReady(): void;
  destroy(): void;
};
/* eslint-enable no-unused-vars */

export function createTodoStore(options: TodoAppMountOptions = {}): TodoStore {
  const listeners = new Set<Listener>();
  let todos: Todo[] = load(options.initialTodos);

  const getSnapshot = (): TodoAppSnapshot => ({ todos });

  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };

  const publish = (event: TodoAppEvent): void => {
    save(todos);
    notify();
    options.onEvent?.(event);
  };

  return {
    getSnapshot,
    getTodos: () => todos,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    addTodo(title) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return;
      }

      const todo: Todo = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        completed: false,
      };

      todos = [...todos, todo];
      publish({ type: 'todo:added', todo, snapshot: getSnapshot() });
    },
    toggleTodo(id) {
      let toggledTodo: Todo | undefined;
      todos = todos.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }

        toggledTodo = { ...todo, completed: !todo.completed };
        return toggledTodo;
      });

      if (toggledTodo) {
        publish({ type: 'todo:toggled', todo: toggledTodo, snapshot: getSnapshot() });
      }
    },
    deleteTodo(id) {
      const nextTodos = todos.filter((todo) => todo.id !== id);
      if (nextTodos.length === todos.length) {
        return;
      }

      todos = nextTodos;
      publish({ type: 'todo:deleted', id, snapshot: getSnapshot() });
    },
    replaceTodos(items) {
      todos = sanitizeTodos(items);
      publish({ type: 'todos:replaced', snapshot: getSnapshot() });
    },
    clearTodos() {
      todos = [];
      publish({ type: 'todos:cleared', snapshot: getSnapshot() });
    },
    emitReady() {
      options.onEvent?.({ type: 'ready', snapshot: getSnapshot() });
    },
    destroy() {
      listeners.clear();
    },
  };
}
