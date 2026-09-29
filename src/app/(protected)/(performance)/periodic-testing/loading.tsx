import { HStack, Skeleton, VStack } from '@chakra-ui/react';

import {
  StatsSkeleton,
  TableSkeleton,
  TitleSkeleton,
} from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <TitleSkeleton action />
      {/* TestingStats: Players Joined + Completed Tests */}
      <StatsSkeleton count={2} />
      {/* TestingFilters: search + date select (no categorical filters) */}
      <HStack gap={{ base: 3, lg: 4 }}>
        <Skeleton height={10} flex={1} />
        <Skeleton height={10} width={36} flexShrink={0} />
      </HStack>
      {/* PlayerPerformanceMatrix */}
      <TableSkeleton />
    </VStack>
  );
}
