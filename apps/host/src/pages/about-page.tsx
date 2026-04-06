import { lazy, Suspense } from 'react';
import { aboutPage } from '../content/uses';

const HackerSignalCanvas = lazy(() =>
  import('@/components/hacker-signal-canvas').then((module) => ({
    default: module.HackerSignalCanvas,
  })),
);
const isTestMode = import.meta.env.MODE === 'test';

const ABOUT_NAME = 'Morten Broesby-Olsen';

export function AboutPage() {
  return (
    <div data-testid="about-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr),minmax(22rem,0.95fr)]">
        <div className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="signal-badge signal-badge--primary">operator profile</div>
              <div className="signal-badge signal-badge--accent">platform notes</div>
            </div>

            <div className="space-y-4">
              <p className="chrome-label text-primary">{aboutPage.headline}</p>
              <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">
                {ABOUT_NAME}
              </h1>
              <p className="max-w-2xl text-lg leading-7 text-foreground sm:text-xl">
                {aboutPage.tagline}
              </p>
              <p
                data-testid="about-bio"
                className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg"
              >
                {aboutPage.bio}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="metric-panel rounded-md">
                <p className="chrome-label">Focus</p>
                <p className="terminal-heading mt-3 text-base text-foreground">Frontend</p>
              </div>
              <div className="metric-panel rounded-md">
                <p className="chrome-label">Highlights</p>
                <p className="metric-value mt-3 text-foreground">{aboutPage.highlights.length}</p>
              </div>
              <div className="metric-panel rounded-md">
                <p className="chrome-label">Values</p>
                <p className="metric-value mt-3 text-foreground">{aboutPage.values.length}</p>
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

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr),minmax(0,0.85fr)]">
        <article data-testid="about-highlights" className="terminal-panel overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Career Highlights</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">Selected work</h2>
            </div>
            <span className="signal-badge signal-badge--muted hidden sm:inline-flex">
              {aboutPage.highlights.length} entries
            </span>
          </div>

          <ul className="mt-5 space-y-3">
            {aboutPage.highlights.map((highlight, index) => (
              <li key={highlight} className="terminal-item rounded-md px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="status-led status-led--live mt-1.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="chrome-label text-primary">
                      Track {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{highlight}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article data-testid="about-values" className="terminal-panel overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Values</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">How I work</h2>
            </div>
            <span className="signal-badge signal-badge--accent hidden sm:inline-flex">
              operating principles
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {aboutPage.values.map((value, index) => (
              <div key={value} className="metric-panel rounded-md">
                <p className="chrome-label">Value {String(index + 1).padStart(2, '0')}</p>
                <p className="mt-3 text-sm leading-6 text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6">
        <article data-testid="about-inspirations" className="terminal-panel overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Inspirations</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">People and craft</h2>
            </div>
            <span className="signal-badge signal-badge--muted hidden sm:inline-flex">
              {aboutPage.inspirations.length} signals
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {aboutPage.inspirations.map((person) => (
              <article key={person.label} className="terminal-item rounded-md p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a
                      href={person.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      <span>{person.label}</span>
                      <span className="chrome-label text-muted-foreground">external</span>
                    </a>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{person.note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
