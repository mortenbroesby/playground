import { useSyncExternalStore } from 'react';
import type { TodoStore } from '../store';

export function TodoList({ store }: { store: TodoStore }) {
  const todos = useSyncExternalStore(store.subscribe, store.getTodos, store.getTodos);

  if (todos.length === 0) {
    return <p className='text-slate-500 text-sm'>No tasks yet. Add one above.</p>;
  }

  return (
    <ul className='space-y-1.5'>
      {todos.map(todo => (
        <li key={todo.id} className='flex items-center gap-3 group'>
          <input
            type='checkbox'
            checked={todo.completed}
            onChange={() => store.toggleTodo(todo.id)}
            className='h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500'
            aria-label={`Toggle ${todo.title}`}
          />
          <span
            className={`flex-1 text-sm ${
              todo.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}
          >
            {todo.title}
          </span>
          <button
            onClick={() => store.deleteTodo(todo.id)}
            className='text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs'
            aria-label={`Delete ${todo.title}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
