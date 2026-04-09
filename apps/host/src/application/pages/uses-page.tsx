import { usesGearPage } from '@/domain/uses/uses';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';

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

export function UsesPage() {
  const totalNodes = usesGearPage.sections.reduce((count, section) => count + section.items.length, 0);
  const externalLinks = usesGearPage.sections.reduce(
    (count, section) => count + section.items.filter((item) => item.href).length,
    0,
  );

  return (
    <>
      <PageMetadata
        title="Uses"
        description={usesGearPage.intro}
        pathname="/uses"
      />
    <div data-testid="uses-page" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
      <section className="space-y-3">
        <p className="chrome-label text-primary">{usesGearPage.handle}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {usesGearPage.title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {usesGearPage.intro}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>{usesGearPage.updatedOn}</span>
          <span>{usesGearPage.sections.length} sections</span>
          <span>{totalNodes} items</span>
          <span>{externalLinks} external links</span>
        </div>
      </section>

      <section className="mt-8 border-t border-border/60 pt-6">
        <div className="space-y-2">
          <a
            href={usesGearPage.profileHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
          >
            {usesGearPage.handle}
            <span className="chrome-label text-muted-foreground">GitHub</span>
          </a>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {liveFeed.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 space-y-8">
        {usesGearPage.sections.map((section, sectionIndex) => (
          <article
            key={section.title}
            data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="border-t border-border/60 pt-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="chrome-label">Section {String(sectionIndex + 1).padStart(2, '0')}</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {section.items.length} items
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
    </>
  );
}
