import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/remote-entry.tsx',
      name: 'TodoListMfe',
      formats: ['es'],
      fileName: () => 'remote-entry.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
});
