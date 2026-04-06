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

    let cancelled = false;
    let handle: TodoAppHandle | null = null;

    queueMicrotask(() => {
      if (cancelled || !containerRef.current) {
        return;
      }

      handle = mount(containerRef.current, {
        onEvent: (event) => {
          setTodos(event.snapshot.todos);
          setLastEvent(formatEvent(event));
        },
      });

      handleRef.current = handle;
      setTodos(handle.getSnapshot().todos);
    });

    return () => {
      cancelled = true;
      const mountedHandle = handle;
      handleRef.current = null;

      if (mountedHandle) {
        queueMicrotask(() => {
          mountedHandle.unmount();
        });
      }
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
    <div className="grid gap-5 xl:grid-cols-[21rem,minmax(0,1fr)]">
      <aside
        data-testid="host-controls"
        className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="chrome-label text-primary">Host Console</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="terminal-heading text-xl text-foreground">Injected composition</h2>
              <span className="signal-badge signal-badge--accent">bridge live</span>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              The host mounts the todo app from the workspace and stays in sync through an explicit
              bridge.
            </p>
          </div>

          <div className="terminal-rule" />

          <div className="grid grid-cols-3 gap-3 text-left text-xs">
            <div className="metric-panel rounded-md">
              <div className="chrome-label">total</div>
              <div data-testid="host-total-count" className="metric-value mt-3 text-foreground">
                {todos.length}
              </div>
            </div>
            <div className="metric-panel rounded-md">
              <div className="chrome-label">done</div>
              <div data-testid="host-done-count" className="metric-value mt-3 text-foreground">
                {completed}
              </div>
            </div>
            <div className="metric-panel rounded-md">
              <div className="chrome-label">open</div>
              <div data-testid="host-open-count" className="metric-value mt-3 text-foreground">
                {todos.length - completed}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={seedTodosFromHost}
              data-testid="seed-todos"
              className="terminal-button w-full"
            >
              Seed Example Todos
            </button>
            <button
              type="button"
              onClick={clearTodosFromHost}
              disabled={todos.length === 0}
              data-testid="clear-todos"
              className="terminal-button terminal-button--ghost w-full"
            >
              Clear From Host
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="terminal-item rounded-md px-4 py-3">
              <p className="chrome-label">Transport</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <span className="status-led status-led--live" aria-hidden="true" />
                Event stream linked
              </div>
            </div>
            <div className="terminal-item rounded-md px-4 py-3">
              <p className="chrome-label">Handshake</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <span className="status-led status-led--accent" aria-hidden="true" />
                Host issued commands
              </div>
            </div>
          </div>

          <div className="log-panel rounded-md">
            <p className="chrome-label">Last Event</p>
            <p data-testid="last-event" className="log-line mt-3 text-sm leading-6">
              {lastEvent}
            </p>
          </div>
        </div>
      </aside>

      <section className="terminal-panel overflow-hidden">
        <div className="terminal-grid flex flex-col gap-4 border-b border-border/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="chrome-label text-primary">Todo App</p>
            <h2 className="terminal-heading mt-2 text-xl text-foreground">
              Workspace-mounted mFE
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="signal-badge signal-badge--primary">injected</span>
            <span className="signal-badge signal-badge--accent">shared theme</span>
          </div>
        </div>

        <div className="border-b border-border/60 bg-background/40 px-5 py-3">
          <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="status-led status-led--live" aria-hidden="true" />
              state synchronized
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="status-led status-led--accent" aria-hidden="true" />
              local storage backing
            </span>
          </div>
        </div>

        <div
          ref={containerRef}
          data-testid="todo-app-container"
          className="min-h-[26rem] bg-[rgba(3,8,9,0.45)]"
        />
      </section>
    </div>
  );
}
