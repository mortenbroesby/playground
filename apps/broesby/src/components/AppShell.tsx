import type { PropsWithChildren } from 'react';
import type { BroesbySection } from '../App';

type AppShellProps = PropsWithChildren<{
  activeSection: BroesbySection;
  displayName: string;
  onReset: () => void;
  onSelectSection: (section: BroesbySection) => void;
}>;

const navItems: Array<{ id: BroesbySection; label: string }> = [
  { id: 'about', label: 'About' },
  { id: 'anecdotes', label: 'Anecdotes' },
  { id: 'chat', label: 'Chat' },
];

export function AppShell({
  activeSection,
  children,
  displayName,
  onReset,
  onSelectSection,
}: AppShellProps) {
  return (
    <main className="family-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Broesby.dk</p>
          <h1 className="hero-title">The family noticeboard</h1>
          <p className="hero-copy">
            Simple, local, and private to this browser. No accounts, no fuss.
          </p>
        </div>
        <div className="hero-meta">
          <p className="meta-label">Posting as</p>
          <p className="meta-value">{displayName || 'Unnamed visitor'}</p>
          <button className="secondary-button" type="button" onClick={onReset}>
            Lock this browser
          </button>
        </div>
      </header>
      <nav className="section-nav" aria-label="Family sections">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={item.id === activeSection ? 'nav-pill is-active' : 'nav-pill'}
            type="button"
            onClick={() => onSelectSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <section className="section-panel">{children}</section>
    </main>
  );
}
