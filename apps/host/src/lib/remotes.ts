export type RemoteDefinition = {
  id: 'todo-input' | 'todo-list' | 'todo-stats';
  name: string;
  owner: string;
  url: string;
};

const remoteUrl = (envKey: string, fallback: string) => process.env[envKey] ?? fallback;

export const remotes: Record<RemoteDefinition['id'], RemoteDefinition> = {
  'todo-input': {
    id: 'todo-input',
    name: 'Todo Input',
    owner: 'Team Capture',
    url: remoteUrl('NEXT_PUBLIC_TODO_INPUT_URL', 'http://localhost:3101/src/remote-entry.tsx'),
  },
  'todo-list': {
    id: 'todo-list',
    name: 'Todo List',
    owner: 'Team Fulfillment',
    url: remoteUrl('NEXT_PUBLIC_TODO_LIST_URL', 'http://localhost:3102/src/remote-entry.tsx'),
  },
  'todo-stats': {
    id: 'todo-stats',
    name: 'Todo Stats',
    owner: 'Team Insights',
    url: remoteUrl('NEXT_PUBLIC_TODO_STATS_URL', 'http://localhost:3103/src/remote-entry.tsx'),
  },
};
