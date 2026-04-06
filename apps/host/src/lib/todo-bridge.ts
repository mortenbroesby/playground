import { TODO_STORAGE_KEY, type Todo, type TodoBridge, type TodoBridgeSnapshot, type TodoDomainEvent } from '@playground/types';

type BridgeOptions = {
  seed?: Todo[];
};

const parseStoredTodos = (): Todo[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(TODO_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Todo[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const createTodoBridge = (options: BridgeOptions = {}): TodoBridge => {
  const listeners = new Set<(snapshot: TodoBridgeSnapshot) => void>();
  let version = 0;
  let todos: Todo[] = options.seed ?? parseStoredTodos();

  const snapshot = (): TodoBridgeSnapshot => ({
    todos,
    version
  });

  const persist = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  };

  const emit = () => {
    const nextSnapshot = snapshot();
    listeners.forEach((listener) => listener(nextSnapshot));
  };

  const applyEvent = (event: TodoDomainEvent): void => {
    if (event.type === 'todo:created') {
      const trimmedTitle = event.payload.title.trim();
      if (!trimmedTitle) {
        return;
      }

      todos = [{ id: event.payload.id, title: trimmedTitle, completed: false }, ...todos];
    }

    if (event.type === 'todo:toggled') {
      todos = todos.map((todo) => (todo.id === event.payload.id ? { ...todo, completed: !todo.completed } : todo));
    }

    if (event.type === 'todo:deleted') {
      todos = todos.filter((todo) => todo.id !== event.payload.id);
    }

    version += 1;
    persist();
    emit();
  };

  return {
    publish: applyEvent,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(snapshot());

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: snapshot
  };
};
