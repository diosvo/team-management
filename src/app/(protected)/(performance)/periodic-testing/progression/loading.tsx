import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('periodicTesting.progression');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[t('manageTypes'), t('results')]}
      stats={6}
      toolbar={{ filters: true, action: 'Push-Up (reps)' }}
      columns={8}
    />
  );
}
