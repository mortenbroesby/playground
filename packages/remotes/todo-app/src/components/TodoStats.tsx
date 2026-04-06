import { useSyncExternalStore } from 'react';
import type { TodoStore } from '../store';

export function TodoStats({ store }: { store: TodoStore }) {
  const todos = useSyncExternalStore(store.subscribe, store.getTodos, store.getTodos);
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const remaining = total - done;

  return (
    <div className='mt-3 grid gap-3 sm:grid-cols-3'>
      <div className='metric-panel rounded-md'>
        <p className='chrome-label'>total</p>
        <p data-testid='todo-total-count' className='metric-value mt-3 text-foreground'>
          {total}
        </p>
      </div>
      <div className='metric-panel rounded-md'>
        <p className='chrome-label'>done</p>
        <p data-testid='todo-done-count' className='metric-value mt-3 text-foreground'>
          {done}
        </p>
      </div>
      <div className='metric-panel rounded-md'>
        <p className='chrome-label'>remaining</p>
        <p data-testid='todo-remaining-count' className='metric-value mt-3 text-foreground'>
          {remaining}
        </p>
      </div>
    </div>
  );
}
