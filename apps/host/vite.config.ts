import path from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { createNowPlayingResponse } from './src/server/now-playing';

type NowPlayingEnv = {
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SPOTIFY_REFRESH_TOKEN?: string;
};

function nowPlayingApiPlugin(env: NowPlayingEnv): Plugin {
  return {
    name: 'now-playing-api',
    configureServer(server) {
      server.middlewares.use('/api/now-playing', async (req, res, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        try {
          const response = await createNowPlayingResponse({
            env,
            fetchImpl: fetch,
          });

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.end(await response.text());
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Failed to load now playing state',
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
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
      nowPlayingApiPlugin({ ...process.env, ...env }),
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
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      setupFiles: ['./tests/setup.ts'],
      testTimeout: 30_000,
    },
  };
});
