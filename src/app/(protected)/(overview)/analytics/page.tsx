import { Metadata } from 'next';

import { HStack, SimpleGrid } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMostAbsenceReasons,
} from '@/actions/analytics';
import { loadAnalyticsFilters } from '@/utils/filters';

import AbsenceReasonsBreakdown from './_components/AbsenceReasonsBreakdown';
import AnalyticsFilters from './_components/AnalyticsFilters';
import AttendanceHistory from './_components/AttendanceHistory';
import AttendanceTrend from './_components/AttendanceTrend';
import PlayerAttendanceRanking from './_components/PlayerAttendanceRanking';
import SummaryStats from './_components/SummaryStats';
import UpcomingSessions from './_components/UpcomingSessions';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View team analytics and trends.',
};

export default async function AnalyticsPage(props: PageProps<'/analytics'>) {
  const params = await loadAnalyticsFilters(props.searchParams);

  const attendanceHistory = await getAttendanceHistory(params.interval);
  const attendanceSummary = await getAttendanceSummary(params.interval);
  const mostAbsenceReasons = await getMostAbsenceReasons(params.interval);

  return (
    <>
      <HStack justifyContent="space-between" marginBottom={6}>
        <PageTitle title="Analytics" />
        <AnalyticsFilters />
      </HStack>

      <SummaryStats records={attendanceHistory} />

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} marginBottom={6}>
        <UpcomingSessions />
        <PlayerAttendanceRanking records={attendanceSummary} />
        <AbsenceReasonsBreakdown reasons={mostAbsenceReasons} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <AttendanceTrend records={attendanceHistory} />
        <AttendanceHistory records={attendanceHistory} />
      </SimpleGrid>
    </>
  );
}
