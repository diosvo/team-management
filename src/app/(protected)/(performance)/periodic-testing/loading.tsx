import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('periodicTesting.header');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[t('manageTypes'), t('addResult')]}
      stats={2}
      // The date select sits in the actions slot; no categorical filters.
      toolbar={{ action: '01/01/2026' }}
      columns={6}
    />
  );
}
