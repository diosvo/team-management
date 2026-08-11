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
  const slugs = [...(await params).slug];
  // remove the appended "content.md"
  slugs.pop();
  const page = source.getPage(slugs);

  if (!page) {
    return new Response('not found', { status: 404 });
  }

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}
