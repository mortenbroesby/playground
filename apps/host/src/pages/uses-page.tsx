import { usesPage } from '@/content/uses';

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
  return (
    <div data-testid="uses-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="signal-badge signal-badge--primary">operator profile</div>
            <div className="space-y-3">
              <p className="chrome-label text-primary">{usesPage.handle}</p>
              <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">
                {usesPage.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Tools, software, and references that shape how {usesPage.name} works day to day.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-panel rounded-md">
              <p className="chrome-label">Updated</p>
              <p data-testid="uses-updated" className="terminal-heading mt-3 text-base text-foreground">
                {usesPage.updatedOn}
              </p>
            </div>
            <div className="metric-panel rounded-md">
              <p className="chrome-label">Profile</p>
              <a
                data-testid="uses-profile-link"
                href={usesPage.profileHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {usesPage.handle}
                <span className="chrome-label text-muted-foreground">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {usesPage.sections.map((section, sectionIndex) => (
          <article
            key={section.title}
            data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="terminal-panel overflow-hidden p-5"
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
