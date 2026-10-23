import type { Metadata } from 'next';
import { Suspense } from 'react';

import { HStack, SimpleGrid } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { loadDashboardFilters } from '@/lib/nuqs';

import {
  AbsenceReasonsBreakdownSection,
  AttendanceTrendSection,
  MatchesRateSection,
  PlayerAttendanceRankingSection,
} from './_components/AnalyticsSections';
import DashboardFilters from './_components/DashboardFilters';
import {
  CardFallback,
  ChartFallback,
  UpcomingFallback,
} from './_components/fallbacks';
import OverviewStats from './_components/OverviewStats';
import QuickActions from './_components/QuickActions';
import UpcomingMatches, {
  UPCOMING_MATCHES,
} from './_components/UpcomingMatches';
import UpcomingSessions, {
  UPCOMING_SESSIONS,
} from './_components/UpcomingSessions';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview',
};

export default async function DashboardsPage(props: PageProps<'/dashboard'>) {
  const { from, to } = await loadDashboardFilters(props.searchParams);
  const range = { from, to };

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Suspense fallback={<CardFallback />}>
          <OverviewStats />
        </Suspense>
        <QuickActions />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <Suspense fallback={<UpcomingFallback {...UPCOMING_SESSIONS} />}>
          <UpcomingSessions />
        </Suspense>
        <Suspense fallback={<UpcomingFallback {...UPCOMING_MATCHES} />}>
          <UpcomingMatches />
        </Suspense>
      </SimpleGrid>

      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title="Analytics" />
        <DashboardFilters />
      </HStack>

      <SimpleGrid
        id="reports-dashboard"
        columns={{ base: 1, md: 2, lg: 3 }}
        gap={6}
      >
        <Suspense fallback={<ChartFallback />}>
          <MatchesRateSection range={range} />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <AttendanceTrendSection range={range} />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <PlayerAttendanceRankingSection range={range} />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <AbsenceReasonsBreakdownSection range={range} />
        </Suspense>
      </SimpleGrid>
    </>
  );
}
