import type { Todo } from '@playground/types';

export const sortTodos = (todos: Todo[]): Todo[] =>
  [...todos].sort((a, b) => {
    if (a.completed === b.completed) {
      return a.title.localeCompare(b.title);
    }

    return Number(a.completed) - Number(b.completed);
  });
