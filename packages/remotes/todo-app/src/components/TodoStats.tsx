import { useSyncExternalStore } from 'react';
import { getTodos, subscribe } from '../store';

export function TodoStats() {
  const todos = useSyncExternalStore(subscribe, getTodos, getTodos);
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const remaining = total - done;

  return (
    <div className='flex gap-6 text-xs text-slate-500 border-t border-slate-800 pt-3'>
      <span>
        <span className='text-slate-300 font-medium'>{total}</span> total
      </span>
      <span>
        <span className='text-slate-300 font-medium'>{done}</span> done
      </span>
      <span>
        <span className='text-slate-300 font-medium'>{remaining}</span> remaining
      </span>
    </div>
  );
}
