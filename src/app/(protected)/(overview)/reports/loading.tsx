import { TableSkeleton, TitleSkeleton } from '@/components/PageSkeleton';
import PageTitle from '@/components/PageTitle';

export default function Loading() {
  return (
    <>
      {/* ReportSchedules: at most one schedule per report interval. */}
      <TitleSkeleton title="Report Schedules" actions={['New Schedule']} />
      <TableSkeleton columns={6} rows={2} />

      {/* ReportHistory pages by 10. */}
      <PageTitle title="Report History" />
      <TableSkeleton columns={7} rows={10} />
    </>
  );
}
