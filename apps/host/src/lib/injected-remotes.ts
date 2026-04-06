import type { TodoBridge } from '@playground/types';

type RemoteModule = {
  mount: (target: HTMLElement, options: { bridge: TodoBridge }) => (() => void) | void;
};

const injectedRemoteLoaders = {
  'todo-input': () => import('@playground/todo-input/src/remote-entry'),
  'todo-list': () => import('@playground/todo-list/src/remote-entry'),
  'todo-stats': () => import('@playground/todo-stats/src/remote-entry')
} as const;

export type InjectedRemoteId = keyof typeof injectedRemoteLoaders;

export const loadInjectedRemote = async (id: InjectedRemoteId): Promise<RemoteModule> => {
  const remote = (await injectedRemoteLoaders[id]()) as Partial<RemoteModule>;

  if (!remote.mount) {
    throw new Error(`Injected remote ${id} does not expose a mount() function.`);
  }

  return remote as RemoteModule;
};
