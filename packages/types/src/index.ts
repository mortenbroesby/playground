export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type TodoCreatedEvent = {
  type: 'todo:created';
  payload: {
    id: string;
    title: string;
  };
};

export type TodoToggledEvent = {
  type: 'todo:toggled';
  payload: {
    id: string;
  };
};

export type TodoDeletedEvent = {
  type: 'todo:deleted';
  payload: {
    id: string;
  };
};

export type TodoDomainEvent = TodoCreatedEvent | TodoToggledEvent | TodoDeletedEvent;

export type TodoBridgeSnapshot = {
  todos: Todo[];
  version: number;
};

export type TodoEventType = TodoDomainEvent['type'];

export type TodoBridgePublish = (event: TodoDomainEvent) => void;

export type TodoBridgeSubscribe = (listener: (snapshot: TodoBridgeSnapshot) => void) => () => void;

export type TodoBridge = {
  publish: TodoBridgePublish;
  subscribe: TodoBridgeSubscribe;
  getSnapshot: () => TodoBridgeSnapshot;
};

export const TODO_STORAGE_KEY = 'playground.todo.bridge.v1';
