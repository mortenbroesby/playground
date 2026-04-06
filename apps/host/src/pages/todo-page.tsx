import { TodoWorkspace } from '@/components/todo-workspace';

export function TodoPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Task Orchestration</p>
            <h1 className="terminal-heading mt-3 text-3xl text-foreground sm:text-4xl">
              Todo control surface
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A host-managed workspace for seeding tasks, monitoring microfrontend state, and
              validating event flow without touching the underlying product logic.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="signal-badge signal-badge--primary">bridge active</span>
            <span className="signal-badge signal-badge--accent">host + remote</span>
          </div>
        </div>
      </section>

      <TodoWorkspace />
    </div>
  );
}
