import { RemoteCard } from '@/components/remote-card';
import { remoteApps } from '@/data/remotes';

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Compendium</p>
        <h1>Micro frontend orchestrator</h1>
        <p>
          Central shell for routing, discovery, and governance of React-based workspace apps.
        </p>
      </header>

      <section className="app-grid" aria-label="Registered workspace applications">
        {remoteApps.map((remote) => (
          <RemoteCard key={remote.id} remote={remote} />
        ))}
      </section>
    </main>
  );
}
