import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_APPS } from '@/lib/nav';

export function Sidebar() {
  return (
    <aside className="w-48 bg-slate-900 border-r border-slate-800 p-3 flex-shrink-0">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Apps</p>
      <nav className="space-y-0.5">
        {NAV_APPS.map(app => (
          <NavLink
            key={app.href}
            to={app.href}
            className={({ isActive }) =>
              cn(
                'block px-3 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-slate-800 text-slate-100 border-l-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )
            }
          >
            {app.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
