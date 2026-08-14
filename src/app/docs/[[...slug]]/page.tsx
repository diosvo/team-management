import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageLastUpdate,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';

import { getMDXComponents } from '../_components/mdx';
import { gitConfig } from '../_lib/shared';
import { docs, getPageMarkdownUrl, source } from '../_lib/source';

interface PageProps {
  params: Promise<{ slug?: Array<string> }>;
}

// Docs are fully enumerable at build time — unknown slugs are a hard 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const content = docs.getPage(page.path);
  if (!content) throw new Error(`unknown page: ${page.path}`);

  const { toc, lastModified } = await content.load();
  const Mdx = content.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <Mdx components={getMDXComponents()} />
      </DocsBody>
      {lastModified && <PageLastUpdate date={lastModified} />}
    </DocsPage>
  );
}
