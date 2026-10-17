import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getAttendances } from '@/actions/attendance';
import { loadAttendanceFilters } from '@/lib/nuqs';

import AttendanceFilters from './_components/AttendanceFilters';
import AttendanceHeader from './_components/AttendanceHeader';
import AttendanceStats from './_components/AttendanceStats';
import AttendanceTable from './_components/AttendanceTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('attendance.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function AttendancePage(props: PageProps<'/attendance'>) {
  const { from, to } = await loadAttendanceFilters(props.searchParams);
  const { data, stats } = await getAttendances({ from, to });

  return (
    <>
      <AttendanceHeader />
      <AttendanceStats stats={stats} />
      <AttendanceFilters />
      <AttendanceTable attendances={data} />
    </>
  );
}
