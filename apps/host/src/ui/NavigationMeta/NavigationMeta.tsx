interface NavigationMetaProps {
  code: string;
  status: string;
  className?: string;
  codeClassName?: string;
  statusClassName?: string;
}

export function NavigationMeta({
  code,
  status,
  className = 'mt-1',
  codeClassName = 'chrome-label',
  statusClassName = 'mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80',
}: NavigationMetaProps) {
  return (
    <div className={className}>
      <div className={codeClassName}>{code}</div>
      <div className={statusClassName}>{status}</div>
    </div>
  );
}
