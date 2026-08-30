import type { Metadata } from 'next';
import { Suspense } from 'react';

import { HStack, SimpleGrid, Skeleton } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { loadDashboardFilters } from '@/lib/nuqs';

import {
  AbsenceReasonsBreakdownSection,
  AttendanceTrendSection,
  MatchesRateSection,
  PlayerAttendanceRankingSection,
} from './_components/AnalyticsSections';
import DashboardFilters from './_components/DashboardFilters';
import OverviewStats from './_components/OverviewStats';
import QuickActions from './_components/QuickActions';
import UpcomingMatches from './_components/UpcomingMatches';
import UpcomingSessions from './_components/UpcomingSessions';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview',
};

const cardFallback = <Skeleton height="180px" borderRadius="md" />;
const chartFallback = <Skeleton height="320px" borderRadius="md" />;

export default async function DashboardsPage(props: PageProps<'/dashboard'>) {
  const { from, to } = await loadDashboardFilters(props.searchParams);
  const range = { from, to };

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Suspense fallback={cardFallback}>
          <OverviewStats />
        </Suspense>
        <QuickActions />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        <Suspense fallback={cardFallback}>
          <UpcomingSessions />
        </Suspense>
        <Suspense fallback={cardFallback}>
          <UpcomingMatches />
        </Suspense>
      </SimpleGrid>

      <HStack justifyContent="space-between">
        <PageTitle title="Analytics" />
        <DashboardFilters />
      </HStack>

      <SimpleGrid
        id="reports-dashboard"
        columns={{ base: 1, md: 2, lg: 3 }}
        gap={6}
      >
        <Suspense fallback={chartFallback}>
          <MatchesRateSection range={range} />
        </Suspense>
        <Suspense fallback={chartFallback}>
          <AttendanceTrendSection range={range} />
        </Suspense>
        <Suspense fallback={chartFallback}>
          <PlayerAttendanceRankingSection range={range} />
        </Suspense>
        <Suspense fallback={chartFallback}>
          <AbsenceReasonsBreakdownSection range={range} />
        </Suspense>
      </SimpleGrid>
    </>
  );
}
