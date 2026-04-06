export type CompositionMode = 'injected' | 'runtime';

export type RemoteDefinition = {
  id: 'todo-input' | 'todo-list' | 'todo-stats';
  name: string;
  owner: string;
  description: string;
  runtimeUrl: string;
};

const getUrl = (value: string | undefined, fallback: string) => value ?? fallback;

const parseMode = (value: string | undefined): CompositionMode => {
  if (value === 'runtime') {
    return 'runtime';
  }

  return 'injected';
};

export const compositionMode = parseMode(process.env.NEXT_PUBLIC_TODO_COMPOSITION_MODE);

export const todoRemotes: RemoteDefinition[] = [
  {
    id: 'todo-input',
    name: 'Todo Input',
    owner: 'Todos / Capture Team',
    description: 'Owns creation form, validation, and UX for new todo capture.',
    runtimeUrl: getUrl(process.env.NEXT_PUBLIC_TODO_INPUT_REMOTE_URL, 'http://localhost:3101/remoteEntry.js')
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    owner: 'Todos / Lifecycle Team',
    description: 'Owns list rendering, toggle flows, deletion controls, and row interactions.',
    runtimeUrl: getUrl(process.env.NEXT_PUBLIC_TODO_LIST_REMOTE_URL, 'http://localhost:3102/remoteEntry.js')
  },
  {
    id: 'todo-stats',
    name: 'Todo Stats',
    owner: 'Todos / Insights Team',
    description: 'Owns completion insights and counters for a task health summary.',
    runtimeUrl: getUrl(process.env.NEXT_PUBLIC_TODO_STATS_REMOTE_URL, 'http://localhost:3103/remoteEntry.js')
  }
];
