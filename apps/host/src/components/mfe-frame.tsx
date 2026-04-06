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
      .catch(() => {
        if (container) {
          container.innerHTML =
            '<p class="text-slate-500 text-sm p-4">MFE unavailable — start todo-app dev server on port 3101.</p>';
        }
      });

    return () => cleanup?.();
  }, [remoteUrl]);

  return <div ref={containerRef} className="w-full" />;
}
