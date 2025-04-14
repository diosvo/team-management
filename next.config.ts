import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    nodeMiddleware: true,
    authInterrupts: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
  serverExternalPackages: ['pg'],
  images: {
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
