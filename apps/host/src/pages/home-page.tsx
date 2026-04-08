import { ArrowRight, Compass, NotebookPen, PencilLine, PersonStanding } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Panel } from '@playground/ui';

const featuredLinks = [
  {
    href: '/about',
    label: 'About',
    title: 'Working style and background',
    description: 'A closer read on how I build, collaborate, and think about frontend systems.',
    icon: PersonStanding,
  },
  {
    href: '/writing',
    label: 'Writing',
    title: 'Notes and essays',
    description: 'Short writing on frontend systems, developer experience, and evolving products.',
    icon: PencilLine,
  },
  {
    href: '/uses',
    label: 'Uses',
    title: 'Tools and setup',
    description: 'The software, hardware, and defaults behind my day-to-day setup.',
    icon: Compass,
  },
  {
    href: '/playground',
    label: 'Playground',
    title: 'Apps and experiments',
    description: 'A separate place for visual studies, micro-apps, and eclectic side ideas.',
    icon: NotebookPen,
  },
] as const;

export function HomePage() {
  return (
    <div data-testid="home-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary">personal site</Badge>
            <Badge tone="accent">work in progress</Badge>
          </div>

          <div className="space-y-4">
            <p className="chrome-label text-primary">@mortenbroesby</p>
            <h1 className="terminal-heading max-w-4xl text-4xl text-foreground sm:text-5xl">
              Morten Broesby-Olsen
            </h1>
            <p className="max-w-3xl text-lg leading-7 text-foreground sm:text-xl">
              Frontend architect and platform-minded builder working across product surfaces,
              developer experience, and long-term maintainability.
            </p>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              This site is shifting from a pure playground shell into a calmer personal home on the
              web. The playground is staying, but it will live as its own section for apps,
              experiments, and odd ideas that deserve room to evolve.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/15"
            >
              Read the about page
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/writing"
              className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              Open writing
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(18rem,0.9fr)]">
        <Panel className="p-5 sm:p-6">
          <p className="chrome-label">Current focus</p>
          <h2 className="terminal-heading mt-3 text-2xl text-foreground">Building with steadier seams</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground sm:text-base">
            <p>
              I care about frontend systems that stay understandable as teams, surfaces, and
              expectations grow.
            </p>
            <p>
              Right now this repo is doing double duty: it is both a personal site in progress and
              a workspace for testing host-and-remote ideas, interaction patterns, and smaller app
              concepts over time.
            </p>
          </div>
        </Panel>

        <Panel tone="quiet" className="p-5 sm:p-6">
          <p className="chrome-label">Next surfaces</p>
          <div className="log-panel mt-4 rounded-md">
            <p className="log-line text-sm leading-6">Writing now has its own section with seeded posts.</p>
            <p className="log-line text-sm leading-6">The playground will become a directory, not one demo page.</p>
            <p className="log-line text-sm leading-6">Public pages will keep getting calmer and more editorial.</p>
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featuredLinks.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.href} className="terminal-panel overflow-hidden p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="chrome-label">{item.label}</p>
                  <h2 className="terminal-heading mt-3 text-xl text-foreground">{item.title}</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-background/50 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>

              <Link
                to={item.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Open {item.label.toLowerCase()}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
