import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export function App() {
  return (
    <div className="bg-slate-950 text-slate-100 antialiased flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
