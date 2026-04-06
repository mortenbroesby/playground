import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn('terminal-input rounded-md', className)} {...props} />;
}
