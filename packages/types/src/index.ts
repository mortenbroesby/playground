export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type TodoDomainEvent =
  | { type: 'todo:created'; payload: { title: string } }
  | { type: 'todo:toggled'; payload: { id: string } }
  | { type: 'todo:deleted'; payload: { id: string } };

export type TodoSnapshot = {
  todos: Todo[];
  version: number;
};

export type Unsubscribe = () => void;

export interface TodoBridge {
  getSnapshot: () => TodoSnapshot;
  publish: (event: TodoDomainEvent) => void;
  subscribe: (listener: (snapshot: TodoSnapshot) => void) => Unsubscribe;
}

export interface MicroFrontendMountProps {
  bridge: TodoBridge;
}

export interface MountedMicroFrontend {
  unmount: () => void;
}

export interface MicroFrontendModule {
  mount: (container: HTMLElement, props: MicroFrontendMountProps) => MountedMicroFrontend;
}
