import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  server: {
    host: '127.0.0.1',
    port: 3101,
    strictPort: true,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: {
    host: '127.0.0.1',
    port: 3101,
    strictPort: true,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  build: {
    outDir: 'dist',
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
    exclude: ['tests/integration/**'],
  },
});
