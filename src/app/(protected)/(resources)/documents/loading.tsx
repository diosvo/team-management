import { SimpleGrid, Skeleton, Stat, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      {/* Page title */}
      <Skeleton height={9} width={36} />
      {/* Stat cards */}
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Stat.Root key={index}>
            <Skeleton width="full" height="90px" />
          </Stat.Root>
        ))}
      </SimpleGrid>
      {/* Filters bar */}
      <Skeleton width="full" height="40px" />
      {/* Card grid */}
      <SimpleGrid
        columns={{ base: 1, sm: 2, lg: 3, '2xl': 4 }}
        gap={{ base: 3, lg: 4 }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} width="full" height="240px" rounded="md" />
        ))}
      </SimpleGrid>
    </VStack>
  );
}
