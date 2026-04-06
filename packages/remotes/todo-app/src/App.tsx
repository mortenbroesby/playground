import type { TodoStore } from './store';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import './index.css';

export function App({ store }: { store: TodoStore }) {
  return (
    <div className='space-y-4 p-4'>
      <TodoInput store={store} />
      <TodoList store={store} />
      <TodoStats store={store} />
    </div>
  );
}
