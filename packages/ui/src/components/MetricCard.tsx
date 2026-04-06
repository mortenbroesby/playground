import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: ReactNode;
  valueClassName?: string;
}

export function MetricCard({
  label,
  value,
  className,
  valueClassName,
  children,
  ...props
}: MetricCardProps) {
  return (
    <div className={cn('metric-panel rounded-md', className)} {...props}>
      <p className="chrome-label">{label}</p>
      {value !== undefined ? (
        <div className={cn('metric-value mt-3 text-foreground', valueClassName)}>{value}</div>
      ) : (
        children
      )}
    </div>
  );
}
