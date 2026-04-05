export type RemoteApp = {
  id: string;
  name: string;
  description: string;
  route: string;
  owner: string;
  status: 'ready' | 'draft';
};

export const remoteApps: RemoteApp[] = [
  {
    id: 'claude-agents',
    name: 'Claude Agents',
    description: 'Prompting workflows, docs, and tools for the claude-agents workspace.',
    route: '/apps/claude-agents',
    owner: 'Platform',
    status: 'ready',
  },
  {
    id: 'new-workspace',
    name: 'Future App Slot',
    description: 'Reserved integration slot for upcoming micro frontends.',
    route: '/apps/new-workspace',
    owner: 'TBD',
    status: 'draft',
  },
];
