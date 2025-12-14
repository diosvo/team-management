import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  cacheComponents: true,
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '',
      },
    ],
    qualities: [25, 50, 75, 100],
    formats: ['image/webp', 'image/avif'],
  },
};

export default withBundleAnalyzer(nextConfig);
