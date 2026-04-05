import { mount } from './remote-entry';

const root = document.querySelector<HTMLElement>('#root');

if (!root) {
  throw new Error('Root container not found');
}

const todos = [{ id: '1', title: 'Try federated todo input', completed: false }];

mount(root, {
  bridge: {
    getSnapshot: () => ({ todos, version: 1 }),
    publish: (event) => {
      console.info('[todo-input][dev] event', event);
    },
    subscribe: () => () => undefined,
  },
});
