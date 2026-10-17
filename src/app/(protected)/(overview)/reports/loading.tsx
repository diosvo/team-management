import { useTranslations } from 'next-intl';

import { TableSkeleton, TitleSkeleton } from '@/components/PageSkeleton';
import PageTitle from '@/components/PageTitle';

export default function Loading() {
  const t = useTranslations('reports');

  return (
    <>
      {/* ReportSchedules: at most one schedule per report interval. */}
      <TitleSkeleton
        title={t('schedules.title')}
        actions={[t('schedules.newSchedule')]}
      />
      <TableSkeleton columns={6} rows={2} />

      {/* ReportHistory pages by 10. */}
      <PageTitle title={t('history.title')} />
      <TableSkeleton columns={7} rows={10} />
    </>
  );
}
