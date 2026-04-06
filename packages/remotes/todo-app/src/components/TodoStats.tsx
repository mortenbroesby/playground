import { useSyncExternalStore } from 'react';
import type { TodoStore } from '../store';

export function TodoStats({ store }: { store: TodoStore }) {
  const todos = useSyncExternalStore(store.subscribe, store.getTodos, store.getTodos);
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const remaining = total - done;

  return (
    <div className='flex gap-6 text-xs text-slate-500 border-t border-slate-800 pt-3'>
      <span>
        <span data-testid='todo-total-count' className='text-slate-300 font-medium'>
          {total}
        </span>{' '}
        total
      </span>
      <span>
        <span data-testid='todo-done-count' className='text-slate-300 font-medium'>
          {done}
        </span>{' '}
        done
      </span>
      <span>
        <span data-testid='todo-remaining-count' className='text-slate-300 font-medium'>
          {remaining}
        </span>{' '}
        remaining
      </span>
    </div>
  );
}
