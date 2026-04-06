'use client';

import { useEffect, useRef } from 'react';

type RemoteMount = (container: HTMLElement) => () => void;

export function MfeFrame({ remoteUrl }: { remoteUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let cleanup: (() => void) | undefined;

    // webpackIgnore: true tells Next.js bundler to leave this as a native
    // browser dynamic import, so the browser resolves the external URL at runtime.
    import(/* webpackIgnore: true */ remoteUrl)
      .then((module: { mount: RemoteMount }) => {
        if (container) {
          cleanup = module.mount(container);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load todo remote', error);

        const message =
          error instanceof Error ? error.message : 'Unknown error while loading remote';

        if (container) {
          container.innerHTML =
            `<div class="p-4 space-y-1"><p class="text-slate-500 text-sm">MFE unavailable — ensure the todo remote is running on port 3101.</p><p class="text-slate-600 text-xs">${message}</p></div>`;
        }
      });

    return () => cleanup?.();
  }, [remoteUrl]);

  return <div ref={containerRef} className="w-full" />;
}
