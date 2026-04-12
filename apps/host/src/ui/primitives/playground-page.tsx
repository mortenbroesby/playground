import type { ReactNode } from 'react';

import { cn } from '@/utils/utils';

export type PlaygroundPageProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
};

export function PlaygroundPage({
  children,
  className,
  contentClassName,
  testId,
}: PlaygroundPageProps) {
  return (
    <div
      data-testid={testId}
      className={cn('mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6', className)}
    >
      <div className={cn('space-y-5', contentClassName)}>{children}</div>
    </div>
  );
}
