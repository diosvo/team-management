import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Provider as UiProvider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';
import { ResponsiveProvider } from '@/contexts/responsive-provider';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SGR Portal',
    template: '%s | SGR Portal',
  },
  description: 'Saigon Rovers Basketball Club',
  facebook: { appId: '123456789' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UiProvider>
          <Toaster />
          <ResponsiveProvider>{children}</ResponsiveProvider>
        </UiProvider>
        {/* Vercel plugins */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
