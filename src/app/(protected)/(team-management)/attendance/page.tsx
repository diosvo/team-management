import { Metadata } from 'next';

import { HStack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { getAttendanceByDate } from '@/actions/attendance';
import { loadAttendanceFilters } from '@/utils/filters';

import AttendanceFilters from './_components/AttendanceFilters';
import AttendanceList from './_components/AttendanceList';
import AttendanceStats from './_components/AttendanceStats';

export const metadata: Metadata = {
  title: 'Attendance',
  description: 'Manage and view team attendance information.',
};

export default async function AttendancePage(props: PageProps<'/attendance'>) {
  const params = await loadAttendanceFilters(props.searchParams);
  const { data, stats } = await getAttendanceByDate(params);

  return (
    <>
      <HStack justifyContent="space-between" marginBottom={6}>
        <PageTitle title="Training Attendance" />
        <AttendanceFilters />
      </HStack>
      <AttendanceStats stats={stats} />
      <AttendanceList attendances={data} />
    </>
  );
}
