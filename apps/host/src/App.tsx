import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export function App() {
  return (
    <div className="terminal-app flex h-screen flex-col overflow-hidden text-foreground antialiased">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="terminal-grid terminal-scrollbars flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
