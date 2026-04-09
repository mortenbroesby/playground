import { ArrowUpRight } from 'lucide-react';
import { PageMetadata } from '../components/page-metadata';
import { PublicPage } from '../components/public-page';
import { usesGearPage } from '../content/uses';

function UsesItemRow({
  label,
  href,
  note,
}: {
  label: string;
  href?: string;
  note?: string;
}) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary"
    >
      <span>{label}</span>
      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </a>
  ) : (
    <span className="text-foreground">{label}</span>
  );

  return (
    <li className="space-y-1">
      <div className="text-sm font-medium">{content}</div>
      {note ? <p className="text-sm leading-6 text-muted-foreground">{note}</p> : null}
    </li>
  );
}

export function UsesPage() {
  return (
    <>
      <PageMetadata
        title="Uses"
        description={usesGearPage.intro}
        pathname="/uses"
      />
      <PublicPage testId="uses-page">
        <section className="space-y-4">
          <p className="chrome-label text-primary">{usesGearPage.handle}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {usesGearPage.title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {usesGearPage.intro}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>{usesGearPage.updatedOn}</span>
            <a
              href={usesGearPage.profileHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <span>{usesGearPage.handle} on GitHub</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {usesGearPage.sections.map((section) => (
            <article
              key={section.title}
              data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="border-t border-border/60 pt-5 first:border-t-0 first:pt-0"
            >
              <div className="mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
              </div>

              <ul className="space-y-4">
                {section.items.map((item) => (
                  <UsesItemRow
                    key={`${section.title}-${item.label}`}
                    label={item.label}
                    href={item.href}
                    note={item.note}
                  />
                ))}
              </ul>
            </article>
          ))}
          </div>
        </section>
      </PublicPage>
    </>
  );
}
