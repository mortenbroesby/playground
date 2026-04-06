import type { Todo } from '@playground/types';

export type TodoAppSnapshot = {
  todos: Todo[];
};

export type TodoAppEvent =
  | { type: 'ready'; snapshot: TodoAppSnapshot }
  | { type: 'todo:added'; todo: Todo; snapshot: TodoAppSnapshot }
  | { type: 'todo:toggled'; todo: Todo; snapshot: TodoAppSnapshot }
  | { type: 'todo:deleted'; id: string; snapshot: TodoAppSnapshot }
  | { type: 'todos:replaced'; snapshot: TodoAppSnapshot }
  | { type: 'todos:cleared'; snapshot: TodoAppSnapshot };

/* eslint-disable no-unused-vars */
export type TodoAppMountOptions = {
  initialTodos?: Todo[];
  onEvent?(event: TodoAppEvent): void;
};

export type TodoAppHandle = {
  unmount(): void;
  getSnapshot(): TodoAppSnapshot;
  replaceTodos(items: Todo[]): void;
  clearTodos(): void;
};
/* eslint-enable no-unused-vars */
