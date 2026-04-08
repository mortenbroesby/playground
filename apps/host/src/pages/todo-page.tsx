import { Badge, Panel } from '@playground/ui';
import { TodoWorkspace } from '@/components/todo-workspace';

export function TodoPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <Panel glow grid className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Task Orchestration</p>
            <h1 className="terminal-heading mt-3 text-lg text-foreground sm:text-xl">
              Todo control surface
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              A host-managed workspace for seeding tasks, monitoring microfrontend state, and
              validating event flow without touching the underlying product logic.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">bridge active</Badge>
            <Badge tone="accent">host + remote</Badge>
          </div>
        </div>
      </Panel>

      <TodoWorkspace />
    </div>
  );
}
