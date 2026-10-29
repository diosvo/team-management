import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/app/docs/_lib/source';

// The search index is derived from static MDX content — build it once.
// With i18n enabled, one index is exported per language; the default
// multilingual tokenizer covers both English and Vietnamese.
export const dynamic = 'force-static';

const server = createFromSource(source);

export async function GET() {
  return server.staticGET();
}
