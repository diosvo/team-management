import { HStack, SimpleGrid } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMatchesRate,
  getMostAbsenceReasons,
} from '@/actions/analytics';
import { loadDashboardFilters } from '@/utils/filters';
import { Metadata } from 'next';
import AbsenceReasonsBreakdown from './_components/AbsenceReasonsBreakdown';
import AttendanceTrend from './_components/AttendanceTrend';
import DashboardFilters from './_components/DashboardFilters';
import MatchesRate from './_components/MatchesRate';
import OverviewStats from './_components/OverviewStats';
import PlayerAttendanceRanking from './_components/PlayerAttendanceRanking';
import QuickActions from './_components/QuickActions';
import UpcomingMatches from './_components/UpcomingMatches';
import UpcomingSessions from './_components/UpcomingSessions';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview',
};

export default async function DashboardsPage(props: PageProps<'/dashboard'>) {
  const params = await loadDashboardFilters(props.searchParams);

  const attendanceHistory = await getAttendanceHistory(params.interval);
  const attendanceSummary = await getAttendanceSummary(params.interval);
  const mostAbsenceReasons = await getMostAbsenceReasons(params.interval);
  const matchesRate = await getMatchesRate(params.interval);

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} marginBottom={6}>
        <OverviewStats />
        <QuickActions />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        <UpcomingSessions />
        <UpcomingMatches />
      </SimpleGrid>

      <HStack marginBlock={6} justifyContent="space-between">
        <PageTitle title="Analytics" />
        <DashboardFilters />
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <MatchesRate records={matchesRate} />
        <AttendanceTrend records={attendanceHistory} />
        <PlayerAttendanceRanking records={attendanceSummary} />
        <AbsenceReasonsBreakdown reasons={mostAbsenceReasons} />
      </SimpleGrid>
    </>
  );
}
