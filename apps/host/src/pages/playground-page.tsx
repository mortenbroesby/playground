import { lazy, Suspense } from 'react';
import { ArrowRight, Boxes, Gamepad2, ListTodo, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, MetricCard, Panel } from '@playground/ui';

const HackerSignalCanvas = lazy(() =>
  import('@/components/hacker-signal-canvas').then((module) => ({
    default: module.HackerSignalCanvas,
  })),
);

const isTestMode = import.meta.env.MODE === 'test';

const playgroundSurfaces = [
  {
    href: '/playground/system',
    label: 'System',
    title: 'Shared UI registry',
    description: 'Browse tokens, utilities, and component previews from the shared UI package.',
    badge: 'reference',
    icon: Boxes,
  },
  {
    href: '/playground/todo',
    label: 'Todo',
    title: 'Todo control surface',
    description: 'Validate host-to-remote state flow without changing the underlying product logic.',
    badge: 'host + remote',
    icon: ListTodo,
  },
  {
    href: '/playground/uplink',
    label: 'Uplink',
    title: 'Uplink terminal',
    description: 'A fan-made hacker sim surface for interaction, pacing, and atmospheric experiments.',
    badge: 'interactive',
    icon: Gamepad2,
  },
  {
    href: '/playground',
    label: 'Signal mesh',
    title: 'Signal mesh',
    description: 'The live canvas study stays here as a featured visual experiment inside the directory.',
    badge: 'visual',
    icon: Sparkles,
  },
] as const;

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
      <Panel glow grid className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Playground directory</p>
            <h1 className="terminal-heading mt-3 text-lg text-foreground sm:text-xl">
              Apps, experiments, and odd ideas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              A separate section for surfaces that should not compete with the personal pages.
              Some entries are practical, some are visual, and some can be stranger or more
              atmospheric than the rest of the site.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">directory live</Badge>
            <Badge tone="accent">eclectic by design</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(22rem,0.9fr)]">
        <Panel className="p-5 sm:p-6">
          <p className="chrome-label">Section notes</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Mode" value={isTestMode ? 'test' : 'live'} />
            <MetricCard label="Entries" value={playgroundSurfaces.length} />
            <MetricCard label="Intent" value="playground" />
          </div>
        </Panel>

        <Panel tone="quiet" className="p-5 sm:p-6">
          <p className="chrome-label">Why it stays separate</p>
          <div className="log-panel mt-4 rounded-md">
            <p className="log-line text-sm leading-6">
              Personal pages can stay calmer and more editorial.
            </p>
            <p className="log-line text-sm leading-6">
              App surfaces can keep stronger chrome and interaction patterns.
            </p>
            <p className="log-line text-sm leading-6">
              New experiments can land here without reshaping the rest of the site.
            </p>
          </div>
        </Panel>
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        {playgroundSurfaces.map((surface) => {
          const Icon = surface.icon;

          return (
            <article
              key={surface.href + surface.title}
              data-testid={`playground-card-${surface.label.toLowerCase()}`}
              className="terminal-panel overflow-hidden p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="chrome-label">{surface.label}</p>
                  <h2 className="terminal-heading mt-3 text-sm text-foreground">{surface.title}</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-background/50 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{surface.description}</p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Badge tone="muted">{surface.badge}</Badge>
                <Link
                  to={surface.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  Open surface
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {isTestMode ? (
        <SignalMeshFallback />
      ) : (
        <section>
          <Panel glow grid className="mb-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <p className="chrome-label text-primary">Featured visual</p>
                <h2 className="terminal-heading mt-2 text-sm text-foreground">Signal mesh</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The live canvas experiment stays here as one of the playground entries instead of
                  being the entire identity of the section.
                </p>
              </div>
              <Badge tone="primary">r3f ready</Badge>
            </div>
          </Panel>

          <Suspense fallback={<SignalMeshFallback />}>
            <HackerSignalCanvas />
          </Suspense>
        </section>
      )}
    </div>
  );
}
