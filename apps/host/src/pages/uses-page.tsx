import { lazy, Suspense } from 'react';
import { usesPage } from '@/content/uses';

const HackerSignalCanvas = lazy(() =>
  import('@/components/hacker-signal-canvas').then((module) => ({
    default: module.HackerSignalCanvas,
  })),
);
const isTestMode = import.meta.env.MODE === 'test';

const liveFeed = [
  'monitoring local shell ergonomics',
  'tuning editor and browser stack',
  'tracking cloud and storage nodes',
];

function UsesItemRow({
  label,
  href,
  note,
  itemCode,
}: {
  label: string;
  href?: string;
  note?: string;
  itemCode: string;
}) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary"
    >
      <span>{label}</span>
      <span className="chrome-label text-muted-foreground">external</span>
    </a>
  ) : (
    <span className="text-foreground">{label}</span>
  );

  return (
    <li className="terminal-item rounded-md px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">{content}</div>
          {note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p> : null}
        </div>
        <span className="chrome-label hidden text-primary sm:inline">{itemCode}</span>
      </div>
    </li>
  );
}

export function UsesPage() {
  const totalNodes = usesPage.sections.reduce((count, section) => count + section.items.length, 0);
  const externalLinks = usesPage.sections.reduce(
    (count, section) => count + section.items.filter((item) => item.href).length,
    0,
  );

  return (
    <div data-testid="uses-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr),minmax(22rem,0.95fr)]">
        <div className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="signal-badge signal-badge--primary">operator profile</div>
              <div className="signal-badge signal-badge--accent">loadout manifest</div>
            </div>

            <div className="space-y-4">
              <p className="chrome-label text-primary">{usesPage.handle}</p>
              <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">
                {usesPage.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A contemporary field kit view of the tools, software, and references that shape how
                {` ${usesPage.name} `}works day to day.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="metric-panel rounded-md">
                <p className="chrome-label">Updated</p>
                <p
                  data-testid="uses-updated"
                  className="terminal-heading mt-3 text-base text-foreground"
                >
                  {usesPage.updatedOn}
                </p>
              </div>
              <div className="metric-panel rounded-md">
                <p className="chrome-label">Nodes</p>
                <p className="metric-value mt-3 text-foreground">{totalNodes}</p>
              </div>
              <div className="metric-panel rounded-md">
                <p className="chrome-label">External</p>
                <p className="metric-value mt-3 text-foreground">{externalLinks}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className="terminal-item rounded-md p-4">
                <p className="chrome-label">Active feed</p>
                <ul className="mt-4 space-y-3">
                  {liveFeed.map((entry) => (
                    <li key={entry} className="flex items-start gap-3">
                      <span className="status-led status-led--live mt-1.5 shrink-0" aria-hidden="true" />
                      <span className="text-sm leading-6 text-muted-foreground">{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="terminal-item rounded-md p-4">
                <p className="chrome-label">Profile</p>
                <a
                  data-testid="uses-profile-link"
                  href={usesPage.profileHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  {usesPage.handle}
                  <span className="chrome-label text-muted-foreground">GitHub</span>
                </a>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Compact systems, dependable workflows, and tools that feel fast under pressure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {isTestMode ? (
          <div className="terminal-panel terminal-panel--glow relative min-h-[20rem] overflow-hidden rounded-md border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(49,217,146,0.14),transparent_38%),linear-gradient(180deg,rgba(3,11,13,0.98),rgba(5,12,14,0.94))] sm:min-h-[24rem]" />
        ) : (
          <Suspense
            fallback={
              <div className="terminal-panel terminal-panel--glow relative min-h-[20rem] overflow-hidden rounded-md border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(49,217,146,0.14),transparent_38%),linear-gradient(180deg,rgba(3,11,13,0.98),rgba(5,12,14,0.94))] sm:min-h-[24rem]" />
            }
          >
            <HackerSignalCanvas />
          </Suspense>
        )}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {usesPage.sections.map((section, sectionIndex) => (
          <article
            key={section.title}
            data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="terminal-panel overflow-hidden p-5 sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="chrome-label">Sector {String(sectionIndex + 1).padStart(2, '0')}</p>
                <h2 className="terminal-heading mt-2 text-xl text-foreground">{section.title}</h2>
              </div>
              <span className="signal-badge signal-badge--muted hidden sm:inline-flex">
                {section.items.length} nodes
              </span>
            </div>

            <ul className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <UsesItemRow
                  key={`${section.title}-${item.label}`}
                  label={item.label}
                  href={item.href}
                  note={item.note}
                  itemCode={`${String(sectionIndex + 1).padStart(2, '0')}-${String(itemIndex + 1).padStart(2, '0')}`}
                />
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
