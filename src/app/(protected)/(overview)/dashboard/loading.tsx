import { Button, HStack, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { CalendarSearch, ChevronDown } from 'lucide-react';

import PageTitle from '@/components/PageTitle';

import {
  CardFallback,
  ChartFallback,
  UpcomingFallback,
} from './_components/fallbacks';
import { UPCOMING_MATCHES } from './_components/UpcomingMatches';
import { UPCOMING_SESSIONS } from './_components/UpcomingSessions';

export default function DashboardLoading() {
  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <CardFallback />
        {/* QuickActions waits on the user's role. */}
        <CardFallback />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <UpcomingFallback {...UPCOMING_SESSIONS} />
        <UpcomingFallback {...UPCOMING_MATCHES} />
      </SimpleGrid>

      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title="Analytics" />
        {/* DashboardFilters: export menu + date window. */}
        <HStack>
          <Skeleton>
            <Button variant="outline">
              Export Report <ChevronDown />
            </Button>
          </Skeleton>
          <Skeleton>
            <Button variant="outline">
              <CalendarSearch />
              This year
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
