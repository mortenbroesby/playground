import { mount, type TodoAppEvent, type TodoAppHandle } from '@playground/todo-app';
import type { Todo } from '@playground/types';
import { useEffect, useRef, useState } from 'react';

const EXAMPLE_TODOS: Todo[] = [
  { id: 'host-seeded-1', title: 'Refactor microfrontend contract', completed: true },
  { id: 'host-seeded-2', title: 'Verify injected composition path', completed: false },
  { id: 'host-seeded-3', title: 'Ship render integration coverage', completed: false },
];

function formatEvent(event: TodoAppEvent): string {
  switch (event.type) {
    case 'ready':
      return 'Todo app mounted and reported ready';
    case 'todo:added':
      return `Todo app added "${event.todo.title}"`;
    case 'todo:toggled':
      return `Todo app toggled "${event.todo.title}"`;
    case 'todo:deleted':
      return 'Todo app deleted a task';
    case 'todos:replaced':
      return `Host replaced todos with ${event.snapshot.todos.length} item(s)`;
    case 'todos:cleared':
      return 'Host cleared all todos';
    default:
      return 'Todo app event received';
  }
}

export function TodoWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<TodoAppHandle | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lastEvent, setLastEvent] = useState('Mounting injected todo app...');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const handle = mount(containerRef.current, {
      onEvent: (event) => {
        setTodos(event.snapshot.todos);
        setLastEvent(formatEvent(event));
      },
    });

    handleRef.current = handle;
    setTodos(handle.getSnapshot().todos);

    return () => {
      handle.unmount();
      handleRef.current = null;
    };
  }, []);

  const seedTodosFromHost = () => {
    handleRef.current?.replaceTodos(EXAMPLE_TODOS);
  };

  const clearTodosFromHost = () => {
    handleRef.current?.clearTodos();
  };

  const completed = todos.filter((todo) => todo.completed).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[20rem,minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-400">Host Controls</p>
          <h2 className="text-lg font-semibold text-slate-100">Injected composition</h2>
          <p className="text-sm text-slate-400">
            The host mounts the todo app from the workspace and stays in sync through an explicit
            bridge.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-lg font-semibold text-slate-100">{todos.length}</div>
            <div className="mt-1 text-slate-500">total</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-lg font-semibold text-slate-100">{completed}</div>
            <div className="mt-1 text-slate-500">done</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-lg font-semibold text-slate-100">{todos.length - completed}</div>
            <div className="mt-1 text-slate-500">open</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={seedTodosFromHost}
            className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Seed Example Todos
          </button>
          <button
            type="button"
            onClick={clearTodosFromHost}
            disabled={todos.length === 0}
            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear From Host
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Last Event</p>
          <p className="mt-2 text-sm text-slate-300">{lastEvent}</p>
        </div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Todo App</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-100">Workspace-mounted mFE</h2>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            injected
          </div>
        </div>

        <div ref={containerRef} className="min-h-[24rem]" />
      </section>
    </div>
  );
}
