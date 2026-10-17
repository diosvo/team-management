import type { Metadata } from 'next';
import { Google_Sans_Flex } from 'next/font/google';
import type { PropsWithChildren } from 'react';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/toaster';
import ZodErrorMap from '@/i18n/ZodErrorMap';
import UiProvider from '@/providers/chakra';

import env from '@env';
import './globals.css';

const ggSans = Google_Sans_Flex({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  adjustFontFallback: false,
  fallback: ['system-ui', 'arial'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shell.metadata');

  return {
    title: {
      default: 'SGR Portal',
      template: '%s | SGR Portal',
    },
    description: t('description'),
    icons: {
      icon: '/icon.png',
    },
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${ggSans.className} antialiased`}>
        <NextIntlClientProvider>
          <ZodErrorMap />
          <NuqsAdapter>
            <UiProvider locale={locale}>
              {children}
              <Toaster />
            </UiProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
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
