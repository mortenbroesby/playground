import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Compendium Orchestrator',
  description: 'Micro frontend wrapper and launchpad for workspace apps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
