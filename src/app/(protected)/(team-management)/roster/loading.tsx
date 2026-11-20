import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('roster');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[t('jerseyOrder.trigger')]}
      toolbar={{ filters: true }}
      columns={8}
    />
  );
}
