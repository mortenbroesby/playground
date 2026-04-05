import '@mantine/core/styles.css';
import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

import './globals.css';

export const metadata: Metadata = {
  title: 'Todo Orchestrator Host',
  description: 'Next.js shell composing independent todo micro frontends at runtime.',
};

const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
