import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function TestTypesLoading() {
  const t = await getTranslations('periodicTesting.testTypes');
  const tCommon = await getTranslations('common');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[tCommon('add')]}
      toolbar={{ filters: true }}
      columns={5}
    />
  );
}
