import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('accounts');

  return (
    <ListPageSkeleton
      title={t('title')}
      iconActions={[t('guide.title')]}
      actions={[t('addUser.trigger')]}
      stats={4}
      columns={10}
    />
  );
}
