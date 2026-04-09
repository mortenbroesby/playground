import { Badge, Panel } from '@playground/ui';
import { TodoWorkspace } from '@/domain/playground/TodoWorkspace';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';

export function TodoPage() {
  return (
    <>
      <PageMetadata
        title="Todo"
        description="Validate host-to-remote state flow without changing the underlying product logic."
      />
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <Panel glow grid className="px-5 py-5 sm:px-6 sm:py-6">
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
            <Badge tone="primary">bridge active</Badge>
            <Badge tone="accent">host + remote</Badge>
          </div>
        </div>
      </Panel>

      <TodoWorkspace />
    </div>
    </>
  );
}
