import { loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';

import { docsUrl, i18n } from './i18n';
import { docsContentRoute, docsRoute } from './shared';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    lastModified: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  i18n,
  // Overrides `baseUrl`: `/docs/<slug>` for English, `/docs/vi/<slug>` for
  // Vietnamese, instead of the default `/vi/docs/<slug>`.
  url: docsUrl,
});

export type DocsPage = (typeof source)['$inferPage'];

/** Markdown export of a page, mirroring its public URL under `/llms.mdx`. */
export function getPageMarkdownUrl(page: DocsPage) {
  const localeSegment =
    page.locale && page.locale !== i18n.defaultLanguage ? page.locale : null;
  const segments = [localeSegment, ...page.slugs, 'content.md'].filter(
    (segment): segment is string => !!segment,
  );

  return {
    segments,
    url:
      '/' +
      [...docsContentRoute.split('/'), ...segments].filter(Boolean).join('/'),
  };
}

export async function getLLMText(page: DocsPage) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
