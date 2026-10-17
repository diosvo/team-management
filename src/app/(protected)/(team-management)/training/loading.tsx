import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function TrainingSessionsLoading() {
  const t = await getTranslations('training.header');
  const tPresets = await getTranslations('components.datePicker.presets');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[t('newSession')]}
      stats={3}
      toolbar={{ date: tPresets('this_year'), filters: true }}
      columns={6}
    />
  );
}
