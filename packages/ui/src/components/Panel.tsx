import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

type PanelBaseProps = {
  as?: ElementType;
  tone?: 'default' | 'quiet';
  glow?: boolean;
  grid?: boolean;
};

export type PanelProps = HTMLAttributes<HTMLElement> & PanelBaseProps;

export function Panel({
  as: Component = 'div',
  tone = 'default',
  glow = false,
  grid = false,
  className,
  ...props
}: PanelProps) {
  return (
    <Component
      className={cn(
        'terminal-panel overflow-hidden',
        tone === 'quiet' && 'terminal-panel--quiet',
        glow && 'terminal-panel--glow',
        grid && 'terminal-grid',
        className,
      )}
      {...props}
    />
  );
}
