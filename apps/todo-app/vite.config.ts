import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  server: {
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: {
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  build: {
    lib: {
      entry: 'src/remote-entry.tsx',
      formats: ['es'],
      fileName: () => 'remoteEntry.js',
    },
    target: 'es2022',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
