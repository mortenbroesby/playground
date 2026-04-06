import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'playground',
  description: 'A monorepo playground for experimenting with multi-agent Claude Code workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
