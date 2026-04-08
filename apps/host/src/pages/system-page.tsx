import { useState } from 'react';
import {
  Badge,
  Button,
  Input,
  MetricCard,
  Panel,
  designSystemComponents,
  designSystemTokens,
  designSystemUtilities,
  type DesignSystemComponent,
  type DesignSystemToken,
} from '@playground/ui';

type SystemView = 'all' | 'components' | 'tokens' | 'utilities';

function matchesQuery(query: string, parts: string[]) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return parts.some((part) => part.toLowerCase().includes(normalized));
}

function TokenPreview({ token }: { token: DesignSystemToken }) {
  if (token.preview === 'font') {
    return (
      <div
        className="rounded-md border border-border/70 bg-background/50 px-3 py-3 text-sm text-foreground"
        style={{ fontFamily: `var(${token.name})` }}
      >
        {token.name === '--font-sans' ? 'SANS SIGNAL 42' : 'MONO SIGNAL 42'}
      </div>
    );
  }

  if (token.preview === 'shadow') {
    return (
      <div className="rounded-md bg-background/40 p-2">
        <div
          className="h-12 rounded-md border border-border/70 bg-[rgba(7,12,14,0.92)]"
          style={{ boxShadow: `var(${token.name})` }}
        />
      </div>
    );
  }

  if (token.preview === 'radius') {
    return (
      <div className="rounded-md bg-background/40 p-2">
        <div
          className="h-12 border border-border/70 bg-primary/15"
          style={{ borderRadius: `var(${token.name})` }}
        />
      </div>
    );
  }

  const background =
    token.preview === 'hsl-color' ? `hsl(var(${token.name}))` : `var(${token.name})`;

  return (
    <div className="rounded-md bg-background/40 p-2">
      <div className="h-12 rounded-md border border-border/70" style={{ background }} />
    </div>
  );
}

function ComponentPreview({ component }: { component: DesignSystemComponent }) {
  if (component.name === 'Button') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button>Launch</Button>
        <Button variant="secondary">Queue</Button>
        <Button variant="danger">Abort</Button>
      </div>
    );
  }

  if (component.name === 'Badge') {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge tone="primary">Live</Badge>
        <Badge tone="accent">Preview</Badge>
        <Badge tone="muted">Queued</Badge>
        <Badge tone="danger">Alert</Badge>
      </div>
    );
  }

  if (component.name === 'Input') {
    return (
      <Input
        aria-label="Component preview input"
        defaultValue="system search"
        readOnly
      />
    );
  }

  if (component.name === 'Panel') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel className="p-3">
          <p className="chrome-label">Default</p>
          <p className="mt-2 text-sm text-muted-foreground">Base workspace shell.</p>
        </Panel>
        <Panel tone="quiet" glow className="p-3">
          <p className="chrome-label">Glow</p>
          <p className="mt-2 text-sm text-muted-foreground">Emphasized callout surface.</p>
        </Panel>
      </div>
    );
  }

  return <MetricCard label="Latency" value="42ms" />;
}

export function SystemPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<SystemView>('all');

  const filteredComponents = designSystemComponents.filter((component) =>
    matchesQuery(query, [component.name, component.description, ...component.keywords]),
  );
  const filteredTokens = designSystemTokens.filter((token) =>
    matchesQuery(query, [token.name, token.group, token.value, token.description]),
  );
  const filteredUtilities = designSystemUtilities.filter((utility) =>
    matchesQuery(query, [utility.name, utility.description]),
  );
  const groupsShown = new Set(filteredTokens.map((token) => token.group)).size;
  const showComponents = view === 'all' || view === 'components';
  const showTokens = view === 'all' || view === 'tokens';
  const showUtilities = view === 'all' || view === 'utilities';

  return (
    <div
      data-testid="system-page"
      className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6"
    >
      <Panel glow grid className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Shared UI Registry</p>
            <h1 className="terminal-heading mt-3 text-lg text-foreground sm:text-xl">
              Searchable token explorer
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse the current design-system tokens and utility classes exposed by
              <code className="mx-1 text-foreground">@playground/ui</code>.
              Search by token name, group, value, or description.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">token registry live</Badge>
            <Badge tone="accent">search enabled</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr),minmax(22rem,0.9fr)]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Search</p>
              <h2 className="terminal-heading mt-2 text-sm text-foreground">Token lookup</h2>
            </div>
            <Badge tone="muted">live filter</Badge>
          </div>

          <div className="mt-5 space-y-3">
            <label htmlFor="token-search" className="chrome-label">
              Search across components, tokens, and utilities
            </label>
            <Input
              id="token-search"
              data-testid="token-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: primary, surface, font, border..."
            />
          </div>

          <div className="mt-5 space-y-3">
            <p className="chrome-label">Browse view</p>
            <div className="flex flex-wrap gap-3">
              <Button
                data-testid="view-all"
                variant={view === 'all' ? 'primary' : 'secondary'}
                aria-pressed={view === 'all'}
                onClick={() => setView('all')}
              >
                All
              </Button>
              <Button
                data-testid="view-components"
                variant={view === 'components' ? 'primary' : 'secondary'}
                aria-pressed={view === 'components'}
                onClick={() => setView('components')}
              >
                Components
              </Button>
              <Button
                data-testid="view-tokens"
                variant={view === 'tokens' ? 'primary' : 'secondary'}
                aria-pressed={view === 'tokens'}
                onClick={() => setView('tokens')}
              >
                Tokens
              </Button>
              <Button
                data-testid="view-utilities"
                variant={view === 'utilities' ? 'primary' : 'secondary'}
                aria-pressed={view === 'utilities'}
                onClick={() => setView('utilities')}
              >
                Utilities
              </Button>
            </div>
          </div>

          <div className="terminal-rule my-6" />

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Components" value={filteredComponents.length} />
            <MetricCard label="Tokens" value={filteredTokens.length} />
            <MetricCard label="Groups visible" value={groupsShown} />
          </div>
        </Panel>

        <Panel tone="quiet" className="p-5 sm:p-6">
          <p className="chrome-label">Search tips</p>
          <div className="log-panel mt-4 rounded-md">
            <p className="log-line text-sm leading-6">Search: `primary`, `muted`, `surface`, `font`</p>
            <p className="log-line text-sm leading-6">Components: `button`, `badge`, `panel`, `input`</p>
            <p className="log-line text-sm leading-6">
              Tokens come from `packages/ui/src/theme.css`
            </p>
            <p className="log-line text-sm leading-6">
              Components and utility classes are listed below for quick scanning
            </p>
          </div>
        </Panel>
      </div>

      {showComponents ? (
        <Panel data-testid="components-section" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Components</p>
              <h2 className="terminal-heading mt-2 text-sm text-foreground">
                Shared primitive showcase
              </h2>
            </div>
            <Badge tone="primary">{filteredComponents.length} shown</Badge>
          </div>

          {filteredComponents.length === 0 ? (
            <div className="terminal-item mt-5 rounded-md px-4 py-4">
              <p className="chrome-label">No components found</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try `button`, `panel`, or `badge`.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredComponents.map((component) => (
                <article
                  key={component.name}
                  data-testid={`component-${component.name.toLowerCase()}`}
                  className="terminal-item rounded-md p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="terminal-heading text-xs text-foreground">
                        {component.name}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {component.description}
                      </p>
                    </div>
                    <Badge tone="accent">primitive</Badge>
                  </div>

                  <div className="mt-4 rounded-md border border-border/60 bg-background/30 p-4">
                    <ComponentPreview component={component} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {component.keywords.map((keyword) => (
                      <Badge key={keyword} tone="muted">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {showTokens ? (
        <Panel data-testid="tokens-section" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Tokens</p>
              <h2 className="terminal-heading mt-2 text-sm text-foreground">
                Design-system inventory
              </h2>
            </div>
            <Badge tone="accent">{filteredTokens.length} matches</Badge>
          </div>

          {filteredTokens.length === 0 ? (
            <div className="terminal-item mt-5 rounded-md px-4 py-4">
              <p className="chrome-label">No results</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a broader search like `color`, `surface`, or `font`.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredTokens.map((token) => (
                <article
                  key={token.name}
                  data-testid={`token-${token.name.slice(2)}`}
                  className="terminal-item rounded-md p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="terminal-heading text-xs text-foreground">{token.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {token.group}
                      </p>
                    </div>
                    <Badge tone="muted">{token.preview}</Badge>
                  </div>

                  <div className="mt-4">
                    <TokenPreview token={token} />
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs leading-6 text-muted-foreground">{token.description}</p>
                    <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2">
                      <p className="chrome-label">Value</p>
                      <p className="mt-2 break-all font-mono text-xs text-foreground">
                        {token.value}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {showUtilities ? (
        <Panel data-testid="utilities-section" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="chrome-label">Utility classes</p>
              <h2 className="terminal-heading mt-2 text-sm text-foreground">
                Shared class inventory
              </h2>
            </div>
            <Badge tone="muted">{filteredUtilities.length} shown</Badge>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {filteredUtilities.map((utility) => (
              <div key={utility.name} className="terminal-item rounded-md px-4 py-3">
                <p className="terminal-heading text-xs text-foreground">{utility.name}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {utility.description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
