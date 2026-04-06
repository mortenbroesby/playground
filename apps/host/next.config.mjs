/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    return {
      beforeFiles: [
        {
          source: '/remotes/todo-app/:path*',
          destination: 'http://127.0.0.1:3101/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
