'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const apps = [
  { href: '/todo', label: 'Todo' },
  { href: '/readme', label: 'README' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <span className="text-indigo-400 font-bold tracking-tight text-sm">playground</span>

      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
      >
        <span>Search apps...</span>
        <kbd className="text-xs text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
          ⌘K
        </kbd>
      </button>

      <a
        href="https://github.com/mortenbroesby/playground"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-slate-100 text-sm transition-colors"
      >
        GitHub ↗
      </a>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search apps..." />
        <CommandList>
          <CommandEmpty>No apps found.</CommandEmpty>
          <CommandGroup heading="Apps">
            {apps.map(app => (
              <CommandItem
                key={app.href}
                onSelect={() => {
                  router.push(app.href);
                  setOpen(false);
                }}
              >
                {app.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
