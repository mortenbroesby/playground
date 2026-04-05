import type { RemoteApp } from '@/data/remotes';

type RemoteCardProps = {
  remote: RemoteApp;
};

export function RemoteCard({ remote }: RemoteCardProps) {
  const statusClass = remote.status === 'ready' ? 'status-ready' : 'status-draft';

  return (
    <article className="remote-card">
      <div className="remote-card-header">
        <h2>{remote.name}</h2>
        <span className={`status-pill ${statusClass}`}>{remote.status}</span>
      </div>
      <p>{remote.description}</p>
      <dl className="meta-grid">
        <div>
          <dt>Route</dt>
          <dd>{remote.route}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{remote.owner}</dd>
        </div>
      </dl>
      <button type="button" className="launch-btn" disabled={remote.status !== 'ready'}>
        {remote.status === 'ready' ? 'Launch app' : 'Awaiting integration'}
      </button>
    </article>
  );
}
