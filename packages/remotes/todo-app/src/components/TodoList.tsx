import { useSyncExternalStore } from 'react';
import type { TodoStore } from '../store';

export function TodoList({ store }: { store: TodoStore }) {
  const todos = useSyncExternalStore(store.subscribe, store.getTodos, store.getTodos);

  if (todos.length === 0) {
    return (
      <div
        data-testid='todo-empty-state'
        className='rounded-md border border-dashed border-border/80 bg-background/60 px-4 py-6 text-sm text-muted-foreground'
      >
        No tasks yet. Add one above.
      </div>
    );
  }

  return (
    <ul data-testid='todo-list' className='space-y-2'>
      {todos.map(todo => (
        <li
          key={todo.id}
          data-testid='todo-list-item'
          className='group terminal-item flex items-center gap-3 rounded-md px-3 py-3'
        >
          <input
            type='checkbox'
            checked={todo.completed}
            onChange={() => store.toggleTodo(todo.id)}
            data-testid='todo-toggle'
            className='h-4 w-4 rounded border-border bg-background accent-primary'
            aria-label={`Toggle ${todo.title}`}
          />
          <div className='min-w-0 flex-1'>
            <span
              className={`block text-sm ${
                todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {todo.title}
            </span>
            <span className='chrome-label mt-2 inline-block'>
              {todo.completed ? 'done' : 'open'}
            </span>
          </div>
          <button
            onClick={() => store.deleteTodo(todo.id)}
            data-testid='todo-delete'
            className='chrome-label rounded-md border border-transparent px-2 py-2 text-muted-foreground opacity-70 transition hover:border-destructive/40 hover:text-destructive group-hover:opacity-100'
            aria-label={`Delete ${todo.title}`}
          >
            purge
          </button>
        </li>
      ))}
    </ul>
  );
}
