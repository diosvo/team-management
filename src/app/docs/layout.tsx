import type { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';

import SearchDialog from './_components/search';
import { baseOptions } from './_lib/layout.shared';
import { appName } from './_lib/shared';
import { source } from './_lib/source';

import './docs.css';

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
};

export default function Layout({ children }: PropsWithChildren) {
  return (
    <RootProvider theme={{ enabled: false }} search={{ SearchDialog }}>
      <DocsLayout {...baseOptions()} tree={source.pageTree}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
