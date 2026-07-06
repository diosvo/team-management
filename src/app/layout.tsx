import type { Metadata } from 'next';
import { Google_Sans_Flex } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/toaster';
import UiProvider from '@/providers/chakra';

import env from '@env';
import './globals.css';

const ggSans = Google_Sans_Flex({
  display: 'swap',
  subsets: ['latin'],
  adjustFontFallback: false,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: {
    default: 'SGR Portal',
    template: '%s | SGR Portal',
  },
  description: 'Saigon Rovers Basketball Club',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ggSans.className} antialiased`}>
        <NuqsAdapter>
          <UiProvider>
            {children}
            <Toaster />
          </UiProvider>
        </NuqsAdapter>
        {/* Vercel plugins */}
        {env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
