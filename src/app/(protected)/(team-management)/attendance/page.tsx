import { Metadata } from 'next';

import { getAttendanceByDate } from '@/actions/attendance';
import { loadAttendanceFilters } from '@/lib/nuqs';

import AttendanceFilters from './_components/AttendanceFilters';
import AttendanceHeader from './_components/AttendanceHeader';
import AttendanceStats from './_components/AttendanceStats';
import AttendanceTable from './_components/AttendanceTable';

export const metadata: Metadata = {
  title: 'Attendance',
  description: 'Manage and view team attendance information.',
};

export default async function AttendancePage(props: PageProps<'/attendance'>) {
  const params = await loadAttendanceFilters(props.searchParams);
  const { data, stats } = await getAttendanceByDate(params.date);

  return (
    <>
      <AttendanceHeader />
      <AttendanceStats stats={stats} />
      <AttendanceFilters />
      <AttendanceTable attendances={data} />
    </>
  );
}
