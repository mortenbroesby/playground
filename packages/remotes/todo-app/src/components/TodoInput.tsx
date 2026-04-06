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
    <form onSubmit={onSubmit} className='space-y-2'>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <input
          data-testid='todo-input'
          className='terminal-input flex-1 rounded-md'
          placeholder='Add a task...'
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-label='todo title'
        />
        <button
          type='submit'
          data-testid='add-todo'
          className='terminal-button rounded-md px-4'
        >
          Add
        </button>
      </div>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </form>
  );
}
