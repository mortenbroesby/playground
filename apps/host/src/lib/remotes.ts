export type RemoteDefinition = {
  id: string;
  name: string;
  owner: string;
  description: string;
  remoteEntryUrl: string;
};

const getUrl = (value: string | undefined, fallback: string) => value ?? fallback;

export const todoRemotes: RemoteDefinition[] = [
  {
    id: 'todo-input',
    name: 'Todo Input',
    owner: 'Todos / Capture Team',
    description: 'Owns creation form, validation, and UX for new todo capture.',
    remoteEntryUrl: getUrl(process.env.NEXT_PUBLIC_TODO_INPUT_REMOTE_URL, 'http://localhost:3101/remoteEntry.js')
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    owner: 'Todos / Lifecycle Team',
    description: 'Owns list rendering, toggle flows, deletion controls, and row interactions.',
    remoteEntryUrl: getUrl(process.env.NEXT_PUBLIC_TODO_LIST_REMOTE_URL, 'http://localhost:3102/remoteEntry.js')
  },
  {
    id: 'todo-stats',
    name: 'Todo Stats',
    owner: 'Todos / Insights Team',
    description: 'Owns completion insights and counters for a task health summary.',
    remoteEntryUrl: getUrl(process.env.NEXT_PUBLIC_TODO_STATS_REMOTE_URL, 'http://localhost:3103/remoteEntry.js')
  }
];
