import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function Loading() {
  const t = await getTranslations('matches.header');
  const tCommon = await getTranslations('common');
  const tPresets = await getTranslations('components.datePicker.presets');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[tCommon('add')]}
      stats={5}
      toolbar={{ date: tPresets('this_year'), filters: true }}
      columns={8}
    />
  );
}
