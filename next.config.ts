import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    authInterrupts: true,
    nodeMiddleware: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '',
      },
    ],
  },
  serverExternalPackages: ['pg'],
};

export default nextConfig;
