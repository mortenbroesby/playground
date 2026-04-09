import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const [{ default: mdx }, { default: remarkFrontmatter }, { default: remarkMdxFrontmatter }] =
    await Promise.all([
      import('@mdx-js/rollup'),
      import('remark-frontmatter'),
      import('remark-mdx-frontmatter'),
    ]);

  const mdxPlugin = mdx({
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
  }) as Plugin;
  mdxPlugin.enforce = 'pre';

  return {
    plugins: [
      mdxPlugin,
      react({
        include: /\.(mdx|js|jsx|ts|tsx)$/,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
      open: true,
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
      environment: 'happy-dom',
      globals: true,
      include: ['tests/**/*.test.tsx'],
      setupFiles: ['./tests/setup.ts'],
      testTimeout: 30_000,
    },
  };
});
