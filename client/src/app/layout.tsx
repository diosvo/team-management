import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Provider } from '@/components/ui/provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SGR Portal',
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
      <body className={inter.variable}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
