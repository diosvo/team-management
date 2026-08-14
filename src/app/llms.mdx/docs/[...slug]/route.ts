import { getLLMText, getPageMarkdownUrl, source } from '@/app/docs/_lib/source';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: Array<string> }> },
) {
  const { slug } = await params;
  if (slug.at(-1) !== 'content.md') {
    return new Response('not found', { status: 404 });
  }
  const page = source.getPage(slug.slice(0, -1));

  if (!page) {
    return new Response('not found', { status: 404 });
  }

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}
