import { lazy, Suspense } from 'react';
import { Badge, MetricCard, Panel } from '@playground/ui';

const HackerSignalCanvas = lazy(() =>
  import('@/components/hacker-signal-canvas').then((module) => ({
    default: module.HackerSignalCanvas,
  })),
);

const isTestMode = import.meta.env.MODE === 'test';

function SignalMeshFallback() {
  return (
    <div className="terminal-panel terminal-panel--glow relative min-h-[24rem] overflow-hidden rounded-md border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(49,217,146,0.14),transparent_38%),linear-gradient(180deg,rgba(3,11,13,0.98),rgba(5,12,14,0.94))] sm:min-h-[30rem]" />
  );
}

export function PlaygroundPage() {
  return (
    <div
      data-testid="playground-page"
      className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6"
    >
      <Panel glow grid className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Visual playground</p>
            <h1 className="terminal-heading mt-3 text-3xl text-foreground sm:text-4xl">
              Signal mesh
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A home for motion studies, canvas experiments, and small visual systems that do
              not need to live on the profile page. Right now it hosts the live signal mesh.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">experiment live</Badge>
            <Badge tone="accent">r3f ready</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(22rem,0.9fr)]">
        <Panel className="p-5 sm:p-6">
          <p className="chrome-label">Mesh notes</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Mode" value={isTestMode ? 'test' : 'live'} />
            <MetricCard label="Surface" value="signal mesh" />
            <MetricCard label="Intent" value="playground" />
          </div>
        </Panel>

        <Panel tone="quiet" className="p-5 sm:p-6">
          <p className="chrome-label">Why it moved</p>
          <div className="log-panel mt-4 rounded-md">
            <p className="log-line text-sm leading-6">
              The about page stays focused on profile and working style.
            </p>
            <p className="log-line text-sm leading-6">
              Interactive visuals can grow here without competing with the profile story.
            </p>
            <p className="log-line text-sm leading-6">
              This route can absorb more sketches and odd experiments over time.
            </p>
          </div>
        </Panel>
      </div>

      {isTestMode ? (
        <SignalMeshFallback />
      ) : (
        <Suspense fallback={<SignalMeshFallback />}>
          <HackerSignalCanvas />
        </Suspense>
      )}
    </div>
  );
}
