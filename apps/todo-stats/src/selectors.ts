import type { Todo } from '@playground/types';

export type TodoStats = {
  total: number;
  completed: number;
  remaining: number;
};

export const getTodoStats = (todos: Todo[]): TodoStats => {
  const completed = todos.filter((todo) => todo.completed).length;

  return {
    total: todos.length,
    completed,
    remaining: todos.length - completed
  };
};
