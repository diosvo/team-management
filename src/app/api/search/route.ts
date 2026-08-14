import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/app/docs/_lib/source';

// The search index is derived from static MDX content — build it once.
export const dynamic = 'force-static';

const server = createFromSource(source, {
  language: 'english',
});

export async function GET() {
  return server.staticGET();
}
