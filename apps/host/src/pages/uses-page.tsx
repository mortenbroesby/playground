import { usesPage } from '@/content/uses';

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
      className="inline-flex items-center gap-2 text-slate-100 transition-colors hover:text-emerald-300"
    >
      <span>{label}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">external</span>
    </a>
  ) : (
    <span className="text-slate-100">{label}</span>
  );

  return (
    <li className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
      <div className="text-sm font-medium">{content}</div>
      {note ? <p className="mt-1 text-sm text-slate-400">{note}</p> : null}
    </li>
  );
}

export function UsesPage() {
  return (
    <div data-testid="uses-page" className="mx-auto max-w-6xl px-6 py-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-300">
              personal site pivot
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                {usesPage.handle}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {usesPage.title}
              </h1>
              <p className="text-base leading-7 text-slate-300 sm:text-lg">
                Tools, software, and references that shape how {usesPage.name} works day to day.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Updated</p>
              <p data-testid="uses-updated" className="mt-2 text-sm font-medium text-slate-100">
                {usesPage.updatedOn}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Profile</p>
              <a
                data-testid="uses-profile-link"
                href={usesPage.profileHref}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-100 transition-colors hover:text-emerald-300"
              >
                {usesPage.handle}
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  GitHub
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {usesPage.sections.map((section) => (
          <article
            key={section.title}
            data-testid={`uses-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Section</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{section.title}</h2>
            </div>

            <ul className="space-y-3">
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
      </section>
    </div>
  );
}
