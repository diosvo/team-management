import { HStack, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

export default function DashboardLoading() {
  return (
    <VStack align="stretch" gap={{ base: 4, lg: 6 }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Skeleton height="266px" />
        <Skeleton height="266px" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        <Skeleton height="266px" />
        <Skeleton height="266px" />
      </SimpleGrid>

      <HStack justifyContent="space-between">
        <Skeleton height={9} width={36} />
        <Skeleton height={10} width={48} />
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="320px" />
        ))}
      </SimpleGrid>
    </VStack>
  );
}
