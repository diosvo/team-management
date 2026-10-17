import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('assets');
  const tCommon = await getTranslations('common');
  const tDatePicker = await getTranslations('components.datePicker');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[tCommon('add')]}
      stats={3}
      toolbar={{ date: tDatePicker('allTime'), filters: true }}
      columns={9}
    />
  );
}
