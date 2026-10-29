import { Status } from '@/utils/response';

import { i18n, isLanguage } from '@/app/docs/_lib/i18n';
import { getLLMText, getPageMarkdownUrl, source } from '@/app/docs/_lib/source';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return source
    .getLanguages()
    .flatMap(({ pages }) =>
      pages.map((page) => ({ slug: getPageMarkdownUrl(page).segments })),
    );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: Array<string> }> },
) {
  const { slug } = await params;
  if (slug.at(-1) !== 'content.md') {
    return new Response('not found', { status: Status.NOT_FOUND });
  }

  // `/llms.mdx/docs/vi/<slug>/content.md` mirrors the public URL: a leading
  // language segment selects the translation, otherwise the default applies.
  const [first, ...rest] = slug.slice(0, -1);
  const lang = isLanguage(first) ? first : i18n.defaultLanguage;
  const slugs = isLanguage(first) ? rest : slug.slice(0, -1);
  const page = source.getPage(slugs, lang);

  if (!page) {
    return new Response('not found', { status: Status.NOT_FOUND });
  }

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}
