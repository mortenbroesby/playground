import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === 'primary'
      ? undefined
      : variant === 'secondary'
        ? 'terminal-button--ghost'
        : 'terminal-button--danger';

  return (
    <button
      data-variant={variant}
      className={cn('terminal-button rounded-md', variantClassName, className)}
      {...props}
    >
      {children}
    </button>
  );
}
