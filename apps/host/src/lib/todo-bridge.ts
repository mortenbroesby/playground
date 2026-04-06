import { TODO_STORAGE_KEY, type Todo, type TodoBridge, type TodoBridgeSnapshot, type TodoDomainEvent } from '@playground/types';

type BridgeOptions = {
  seed?: Todo[];
};

const DEBUG_TODO_BRIDGE = process.env.NEXT_PUBLIC_TODO_BRIDGE_DEBUG === 'true';

const logTodoBridgeDebug = (prefix: string, payload: Record<string, unknown>) => {
  if (!DEBUG_TODO_BRIDGE) {
    return;
  }

  console.debug(prefix, payload);
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
    logTodoBridgeDebug('[todo-bridge][emit]', {
      version: nextSnapshot.version,
      todoCount: nextSnapshot.todos.length,
      listenerCount: listeners.size
    });
    listeners.forEach((listener) => listener(nextSnapshot));
  };

  const applyEvent = (event: TodoDomainEvent): void => {
    logTodoBridgeDebug('[todo-bridge][publish]', {
      eventType: event.type,
      payload: event.payload
    });

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
      const currentSnapshot = snapshot();
      logTodoBridgeDebug('[todo-bridge][subscribe]', {
        version: currentSnapshot.version,
        todoCount: currentSnapshot.todos.length,
        listenerCount: listeners.size
      });
      listener(currentSnapshot);

      return () => {
        listeners.delete(listener);
        logTodoBridgeDebug('[todo-bridge][unsubscribe]', {
          listenerCount: listeners.size
        });
      };
    },
    getSnapshot: snapshot
  };
};
