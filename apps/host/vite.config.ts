import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
  test: {
    include: ['tests/**/*.browser.tsx'],
    testTimeout: 30_000,
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
});
