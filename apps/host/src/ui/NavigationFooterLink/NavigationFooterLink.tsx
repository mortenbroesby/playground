import { Link } from 'react-router-dom';

interface NavigationFooterLinkProps {
  className: string;
  href: string;
  label: string;
  linkClassName: string;
  onClick?: () => void;
  showPrefix?: boolean;
}

export function NavigationFooterLink({
  className,
  href,
  label,
  linkClassName,
  onClick,
  showPrefix = true,
}: NavigationFooterLinkProps) {
  return (
    <div className={className}>
      <Link to={href} onClick={onClick} className={linkClassName}>
        {showPrefix ? <span className="chrome-label text-primary">exit</span> : null}
        <span>{label}</span>
      </Link>
    </div>
  );
}
