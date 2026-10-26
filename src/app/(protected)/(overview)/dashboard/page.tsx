import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

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
import UpcomingMatches from './_components/UpcomingMatches';
import UpcomingSessions from './_components/UpcomingSessions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function DashboardsPage(props: PageProps<'/dashboard'>) {
  const { from, to } = await loadDashboardFilters(props.searchParams);
  const range = { from, to };
  const t = await getTranslations('dashboard');

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Suspense fallback={<CardFallback />}>
          <OverviewStats />
        </Suspense>
        <QuickActions />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <Suspense fallback={<UpcomingFallback section="upcomingSessions" />}>
          <UpcomingSessions />
        </Suspense>
        <Suspense fallback={<UpcomingFallback section="upcomingMatches" />}>
          <UpcomingMatches />
        </Suspense>
      </SimpleGrid>

      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title={t('analytics')} />
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
