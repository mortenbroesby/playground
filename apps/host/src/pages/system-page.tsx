import { useState, type ChangeEvent } from 'react';
import { Badge, Button, Input, MetricCard, Panel } from '@playground/ui';

const statusBadges = [
  { label: 'system live', tone: 'primary' as const },
  { label: 'preview mode', tone: 'accent' as const },
  { label: 'requires review', tone: 'danger' as const },
  { label: 'backlog', tone: 'muted' as const },
];

const componentNotes = [
  'Start with tokens and primitives, not a giant component catalog.',
  'Prove shared UI in the host before pushing it into more remotes.',
  'Keep the package opinionated enough to shape the product, but small enough to stay honest.',
];

export function SystemPage() {
  const [inputValue, setInputValue] = useState('Design system route online');

  return (
    <div data-testid="system-page" className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <Panel glow grid className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Shared UI Registry</p>
            <h1 className="terminal-heading mt-3 text-3xl text-foreground sm:text-4xl">
              Barebones design system
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A lightweight proving ground for the shared tokens and primitives in
              <code className="mx-1 text-foreground">@playground/ui</code>.
              The goal is to make the package real through use, not by inventing a giant component zoo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">ui package live</Badge>
            <Badge tone="accent">host consuming primitives</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(22rem,0.9fr)]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Tokens and states</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">Status language</h2>
            </div>
            <span className="chrome-label text-muted-foreground">v0.1</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {statusBadges.map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>

          <div className="terminal-rule my-6" />

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Primitives" value="05" />
            <MetricCard label="Current host use" value="live" />
            <MetricCard label="Direction" value="shared shell UI" valueClassName="terminal-heading text-base text-foreground" />
          </div>
        </Panel>

        <Panel tone="quiet" className="p-5 sm:p-6">
          <p className="chrome-label">Notes</p>
          <div className="log-panel mt-4 rounded-md">
            {componentNotes.map((note) => (
              <p key={note} className="log-line text-sm leading-6">
                {note}
              </p>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Primitives</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">Buttons and inputs</h2>
            </div>
            <Badge tone="muted">interactive</Badge>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
              <Button variant="danger">Danger action</Button>
            </div>

            <div className="space-y-2">
              <label htmlFor="system-input" className="chrome-label">
                Terminal input
              </label>
              <Input
                id="system-input"
                value={inputValue}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Rollout path</p>
              <h2 className="terminal-heading mt-2 text-xl text-foreground">What comes next</h2>
            </div>
            <Badge tone="accent">small steps</Badge>
          </div>

          <ul className="mt-5 space-y-3">
            <li className="terminal-item rounded-md px-4 py-3">
              <p className="chrome-label">01</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Move a couple of repeated host patterns into `@playground/ui`.
              </p>
            </li>
            <li className="terminal-item rounded-md px-4 py-3">
              <p className="chrome-label">02</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Reuse the same primitives inside the todo remote once they feel stable.
              </p>
            </li>
            <li className="terminal-item rounded-md px-4 py-3">
              <p className="chrome-label">03</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Decide later whether this stays a host route or becomes a dedicated showcase app.
              </p>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
