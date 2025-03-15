import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    nodeMiddleware: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
  serverExternalPackages: ['pg'],
};

export default nextConfig;
