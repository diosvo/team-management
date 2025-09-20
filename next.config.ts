import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    authInterrupts: true,
    webpackBuildWorker: true,
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
  serverExternalPackages: ['bcryptjs'],
};

export default withBundleAnalyzer(nextConfig);
