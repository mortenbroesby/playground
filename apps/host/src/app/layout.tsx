import '@mantine/core/styles.css';
import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

import './globals.css';

export const metadata: Metadata = {
  title: 'Todo MFE Orchestrator',
  description: 'Production-minded micro frontend demo with Next.js shell + runtime composition.'
};

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
