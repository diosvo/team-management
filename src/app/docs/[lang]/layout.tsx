import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { DocsProvider } from '../_components/provider';
import { isLanguage } from '../_lib/i18n';
import { baseOptions } from '../_lib/layout.shared';
import { appName } from '../_lib/shared';
import { source } from '../_lib/source';

import '../docs.css';

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
};

interface LayoutProps extends PropsWithChildren {
  params: Promise<{ lang: string }>;
}

export default async function Layout({ params, children }: LayoutProps) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();

  return (
    <DocsProvider lang={lang}>
      <DocsLayout {...baseOptions(lang)} tree={source.getPageTree(lang)}>
        {children}
      </DocsLayout>
    </DocsProvider>
  );
}
