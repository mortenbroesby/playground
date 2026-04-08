import { GameWorkspace } from '@/components/game-workspace';

export function GamePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <GameWorkspace />

      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="chrome-label text-primary">Hacker Simulation</p>
            <h1 className="terminal-heading mt-3 text-3xl text-foreground sm:text-4xl">
              Uplink terminal
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Navigate the network, crack credentials, bypass firewalls. Complete the mission before the trace closes in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="signal-badge signal-badge--primary">phaser active</span>
            <span className="signal-badge signal-badge--accent">interactive</span>
          </div>
        </div>
      </section>

      <p className="px-1 text-xs text-muted-foreground/50">
        Fan-made hacker sim inspired by{' '}
        <span className="text-muted-foreground/70">Uplink</span> by Introversion Software (2001).
        Not affiliated with or endorsed by Introversion Software Ltd.
      </p>
    </div>
  );
}
