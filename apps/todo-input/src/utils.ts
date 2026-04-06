export const normalizeTitle = (title: string): string => title.trim();

export const createTodoId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
