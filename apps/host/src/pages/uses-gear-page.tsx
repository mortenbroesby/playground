import { usesGearPage } from '../content/uses';

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

const liveFeed = [
  'maintaining editor and shell ergonomics',
  'tuning browser, design, and planning tools',
  'keeping cloud storage and delivery infrastructure close at hand',
];

export function UsesGearPage() {
  const totalNodes = usesGearPage.sections.reduce((count, section) => count + section.items.length, 0);
  const externalLinks = usesGearPage.sections.reduce(
    (count, section) => count + section.items.filter((item) => item.href).length,
    0,
  );

  return (
    <div data-testid="uses-gear-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="signal-badge signal-badge--primary">loadout manifest</div>
            <div className="signal-badge signal-badge--accent">gear inventory</div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),22rem]">
            <div className="space-y-4">
              <p className="chrome-label text-primary">{usesGearPage.handle}</p>
              <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">
                {usesGearPage.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                The gear, software, and working systems behind how {usesGearPage.name} ships,
                reviews, and maintains frontend platforms.
              </p>
            </div>

            <div className="terminal-item rounded-md p-4">
              <p className="chrome-label">Profile</p>
              <a
                href={usesGearPage.profileHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {usesGearPage.handle}
                <span className="chrome-label text-muted-foreground">GitHub</span>
              </a>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Opinionated defaults, dependable tooling, and systems that hold up over time.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="metric-panel rounded-md">
              <p className="chrome-label">Updated</p>
              <p className="terminal-heading mt-3 text-base text-foreground">
                {usesGearPage.updatedOn}
              </p>
            </div>
            <div className="metric-panel rounded-md">
              <p className="chrome-label">Sections</p>
              <p className="metric-value mt-3 text-foreground">{usesGearPage.sections.length}</p>
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
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {usesGearPage.sections.map((section, sectionIndex) => (
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
