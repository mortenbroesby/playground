import { mount } from '@playground/uplink-game';
import { useEffect, useRef } from 'react';

export function GameWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    let destroy: (() => void) | null = null;

    queueMicrotask(() => {
      if (destroyed || !containerRef.current) return;
      destroy = mount(containerRef.current);
    });

    return () => {
      destroyed = true;
      if (destroy) queueMicrotask(() => { destroy?.(); });
    };
  }, []);

  return (
    <div className="terminal-panel terminal-panel--glow overflow-hidden p-3 sm:p-5">
      <div className="mx-auto max-w-[840px]">
        <div ref={containerRef} data-testid="game-container" className="aspect-[900/560] w-full bg-[#030b0d] [touch-action:none]" />
      </div>
    </div>
  );
}
