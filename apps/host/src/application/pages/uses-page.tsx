import { usesGearPage } from '@/domain/uses/uses';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';
import { PersonalPage } from '@/ui/primitives/personal-page';

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
      <span className="text-xs text-muted-foreground">External</span>
    </a>
  ) : (
    <span className="text-foreground">{label}</span>
  );

  return (
    <li className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 shadow-sm shadow-black/5">
      <div className="min-w-0 space-y-2">
        <div className="text-sm font-medium">{content}</div>
        {note ? <p className="text-sm leading-6 text-muted-foreground">{note}</p> : null}
      </div>
    </li>
  );
}

function UsesInlineItemLink({
  label,
  href,
}: {
  label: string;
  href?: string;
}) {
  if (!href) {
    return <span>{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="transition-colors hover:text-primary"
    >
      {label}
    </a>
  );
}

const liveFeed = [
  'VS Code, Warp, and the CLI agent stack make up the daily path through work.',
  'Arc, Figma, and Linear stay open most of the day.',
  'Vercel and GitHub are the default path from local work to production.',
];

const sectionNotes: Partial<Record<(typeof usesGearPage.sections)[number]['title'], string>> = {
  'Editor & Shell': 'The tools that stay open from first coffee to final commit.',
  'VS Code Extensions': 'Small additions that remove friction without making the editor noisy.',
  Software: 'The day-to-day apps that keep design, planning, and execution moving.',
  Hardware: 'A deliberately boring setup: reliable, quiet, and easy to live with.',
  Cloud: 'The services behind backups, collaboration, and shipping.',
  Philosophies: 'A couple of systems that shape how I plan and make tradeoffs.',
};

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
      />
      <PersonalPage testId="uses-page" contentClassName="space-y-12">
        <section className="space-y-5">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Uses</p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Tools I keep within arm&apos;s reach.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-foreground/90">
                {usesGearPage.intro}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                This is less a gear flex and more a snapshot of the setup that makes everyday
                product work feel calm, legible, and easy to ship.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>Updated {usesGearPage.updatedOn}</span>
              <span>{usesGearPage.sections.length} categories</span>
              <span>{totalNodes} tools and references</span>
              <span>{externalLinks} linked out</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 pt-8">
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Current defaults</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The shortest version of the stack I rely on most right now.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {usesGearPage.currentDefaults.map((item) => (
                  <div key={item.label} className="space-y-1 rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                      {item.items.map((value, index) => (
                        <span key={`${item.label}-${value.label}`} className="inline-flex items-center gap-2">
                          {index > 0 ? <span className="text-muted-foreground">+</span> : null}
                          <UsesInlineItemLink label={value.label} href={value.href} />
                        </span>
                      ))}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-border/60 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">What this setup optimizes for</p>
            <a
              href={usesGearPage.profileHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {usesGearPage.handle}
              <span className="text-xs">on GitHub</span>
            </a>
          </div>

          <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
            {liveFeed.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-8">
          {usesGearPage.sections.map((section) => (
            <article
              key={section.title}
              data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="space-y-5 border-t border-border/60 pt-8"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{section.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {sectionNotes[section.title] ?? `${section.items.length} tools in steady rotation.`}
                  </p>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <UsesItemRow
                      key={`${section.title}-${item.label}`}
                      label={item.label}
                      href={item.href}
                      note={item.note}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      </PersonalPage>
    </>
  );
}
