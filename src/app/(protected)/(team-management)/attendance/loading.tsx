import { getTranslations } from 'next-intl/server';

import ListPageSkeleton from '@/components/PageSkeleton';

export default async function AttendanceLoading() {
  const t = await getTranslations('attendance');
  const tPresets = await getTranslations('components.datePicker.presets');

  return (
    <ListPageSkeleton
      title={t('title')}
      actions={[t('markAttendance')]}
      stats={4}
      toolbar={{ date: tPresets('today'), filters: true }}
      columns={6}
    />
  );
}
