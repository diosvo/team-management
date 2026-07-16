import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: {
    // sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    // Common thumbnail/avatar sizes in the design system
    imageSizes: [32, 48, 64, 96, 128, 192, 256],
    // Allowlist quality values
    qualities: [50, 75, 85, 100],
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        pathname: '/**',
        search: '',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};

export default nextConfig;
