import { useTranslations } from 'next-intl';

import { Button, HStack, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { CalendarSearch, ChevronDown } from 'lucide-react';

import PageTitle from '@/components/PageTitle';

import {
  CardFallback,
  ChartFallback,
  UpcomingFallback,
} from './_components/fallbacks';

export default function DashboardLoading() {
  const t = useTranslations('dashboard');
  const tComponents = useTranslations('components');

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <CardFallback />
        {/* QuickActions waits on the user's role. */}
        <CardFallback />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <UpcomingFallback section="upcomingSessions" />
        <UpcomingFallback section="upcomingMatches" />
      </SimpleGrid>

      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title={t('analytics')} />
        {/* DashboardFilters: export menu + date window. */}
        <HStack>
          <Skeleton>
            <Button variant="outline">
              {t('filters.exportReport')} <ChevronDown />
            </Button>
          </Skeleton>
          <Skeleton>
            <Button variant="outline">
              <CalendarSearch />
              {tComponents('datePicker.presets.this_year')}
            </Button>
          </Skeleton>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {Array.from({ length: 4 }, (_, index) => (
          <ChartFallback key={index} />
        ))}
      </SimpleGrid>
    </>
  );
}
