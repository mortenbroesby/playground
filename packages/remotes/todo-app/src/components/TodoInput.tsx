import { useState, type FormEvent } from 'react';
import type { TodoStore } from '../store';

export function TodoInput({ store }: { store: TodoStore }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('Please enter a task.');
      return;
    }
    store.addTodo(value);
    setValue('');
    setError('');
  };

  return (
    <form onSubmit={onSubmit} className='space-y-1'>
      <div className='flex gap-2'>
        <input
          data-testid='todo-input'
          className='flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
          placeholder='Add a task...'
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-label='todo title'
        />
        <button
          type='submit'
          data-testid='add-todo'
          className='px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors'
        >
          Add
        </button>
      </div>
      {error && <p className='text-red-400 text-xs'>{error}</p>}
    </form>
  );
}
