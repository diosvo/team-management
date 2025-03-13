import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    nodeMiddleware: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
};

export default nextConfig;
