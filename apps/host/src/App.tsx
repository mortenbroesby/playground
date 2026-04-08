import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { MobileDrawer } from '@/components/mobile-drawer';
import { Sidebar } from '@/components/sidebar';

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <div className="terminal-app flex h-screen flex-col overflow-hidden text-foreground antialiased">
      <Header onMenuOpen={() => setIsDrawerOpen(true)} />
      <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="terminal-grid terminal-scrollbars flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
