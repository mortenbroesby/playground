import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { createTodoStore } from './store';
import type { TodoAppHandle, TodoAppMountOptions } from './contracts';

export function mount(target: HTMLElement, options: TodoAppMountOptions = {}): TodoAppHandle {
  const store = createTodoStore(options);
  const root: Root = createRoot(target);

  root.render(<App store={store} />);
  store.emitReady();

  return {
    unmount() {
      root.unmount();
      store.destroy();
    },
    getSnapshot: store.getSnapshot,
    replaceTodos: store.replaceTodos,
    clearTodos: store.clearTodos,
  };
}
