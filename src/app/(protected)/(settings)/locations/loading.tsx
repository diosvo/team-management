import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('locations');
  const tCommon = await getTranslations('common');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[tCommon('add')]}
      columns={4}
    />
  );
}
