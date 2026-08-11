import { llms } from 'fumadocs-core/source';

import { source } from '@/app/docs/_lib/source';

export const dynamic = 'force-static';

export function GET() {
  return new Response(llms(source).index());
}
