'use client';

export function Header() {
  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <span className="text-indigo-400 font-bold tracking-tight text-sm">playground</span>

      <a
        href="https://github.com/mortenbroesby/playground"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-slate-100 text-sm transition-colors"
      >
        GitHub ↗
      </a>
    </header>
  );
}
