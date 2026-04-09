import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';

type PublicPageProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
};

export function PublicPage({
  children,
  className,
  contentClassName,
  testId,
}: PublicPageProps) {
  return (
    <div
      data-testid={testId}
      className={cn('mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14', className)}
    >
      <div className={cn('space-y-8', contentClassName)}>{children}</div>
    </div>
  );
}
