import './globals.css';

import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Google_Sans_Flex } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/toaster';
import ZodErrorMap from '@/i18n/ZodErrorMap';
import UiProvider from '@/providers/chakra';

const ggSans = Google_Sans_Flex({
  display: 'swap',
  // Latin-only preloading avoids warnings on English pages
  // Vietnamese glyphs load on demand.
  subsets: ['latin'],
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
      </body>
    </html>
  );
}
