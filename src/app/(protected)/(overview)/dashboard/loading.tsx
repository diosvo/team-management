import { Button, HStack, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { CalendarSearch, ChevronDown } from 'lucide-react';

import PageTitle from '@/components/PageTitle';

import { CardFallback, ChartFallback } from './_components/fallbacks';

// Mirrors `page.tsx` so nothing shifts while sections stream in.
export default function DashboardLoading() {
  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <CardFallback />
        {/* QuickActions waits on the user's role. */}
        <CardFallback />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <CardFallback />
        <CardFallback />
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
