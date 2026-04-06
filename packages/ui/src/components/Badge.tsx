import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'primary' | 'accent' | 'danger' | 'muted';
}

export function Badge({ tone = 'primary', className, ...props }: BadgeProps) {
  return <span className={cn('signal-badge', `signal-badge--${tone}`, className)} {...props} />;
}
