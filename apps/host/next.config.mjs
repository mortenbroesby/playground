/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ['@playground/todo-input', '@playground/todo-list', '@playground/todo-stats']
};

export default nextConfig;
