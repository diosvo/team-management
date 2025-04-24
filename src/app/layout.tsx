import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Provider as UiProvider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';
import { getUser } from '@/features/user/actions/auth';
import { UserProvider } from '@/hooks/use-user';
import { DialogProvider } from '../contexts/dialog-context';

import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: {
    default: 'SGR Portal',
    template: '%s | SGR Portal',
  },
  description: 'Saigon Rovers Basketball Club',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <UiProvider>
          <Toaster />
          <DialogProvider>
            <UserProvider userPromise={userPromise}>{children}</UserProvider>
          </DialogProvider>
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
