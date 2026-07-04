import {
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stat,
  VStack,
} from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      {/* TestingHeader: title + actions menu */}
      <HStack justifyContent="space-between">
        <Skeleton height={9} width={56} />
        <Skeleton height={9} width={28} />
      </HStack>
      {/* TestingStats: Players Joined + Completed Tests */}
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Stat.Root key={index}>
            <Skeleton width="full" height="90px" />
          </Stat.Root>
        ))}
      </SimpleGrid>
      {/* TestingFilters: search + date select (no categorical filters) */}
      <HStack gap={{ base: 3, lg: 4 }}>
        <Skeleton height={10} flex={1} />
        <Skeleton height={10} width={36} flexShrink={0} />
      </HStack>
      {/* PlayerPerformanceMatrix */}
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </VStack>
  );
}
