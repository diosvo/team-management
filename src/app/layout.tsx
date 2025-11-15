import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Provider as UiProvider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';

import env from '@/schemas/env';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
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
      <body className={`${geist.variable} ${geist.className}`}>
        <UiProvider>
          <Toaster />
          {children}
        </UiProvider>
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
