import { mount } from './remote-entry';

const root = document.querySelector<HTMLElement>('#root');

if (!root) {
  throw new Error('Root container not found');
}

const todos = [
  { id: '1', title: 'MFE list in standalone mode', completed: false },
  { id: '2', title: 'Wire host bridge', completed: true },
];

mount(root, {
  bridge: {
    getSnapshot: () => ({ todos, version: 1 }),
    publish: (event) => {
      console.info('[todo-list][dev] event', event);
    },
    subscribe: () => () => undefined,
  },
});
