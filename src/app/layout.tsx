import type { Metadata } from 'next';
import { Google_Sans_Flex } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import UiProvider from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';

import env from '@env';
import './globals.css';

export const ggSans = Google_Sans_Flex({
  display: 'swap',
  subsets: ['latin'],
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
    <html lang="en">
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
