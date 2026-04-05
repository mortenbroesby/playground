import { mount } from './remote-entry';

const root = document.querySelector<HTMLElement>('#root');

if (!root) {
  throw new Error('Root container not found');
}

const todos = [
  { id: '1', title: 'A completed item', completed: true },
  { id: '2', title: 'An open item', completed: false },
];

mount(root, {
  bridge: {
    getSnapshot: () => ({ todos, version: 1 }),
    publish: (event) => {
      console.info('[todo-stats][dev] event', event);
    },
    subscribe: () => () => undefined,
  },
});
