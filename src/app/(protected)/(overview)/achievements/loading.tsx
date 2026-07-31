import { HStack, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

export default function AchievementsLoading() {
  return (
    <VStack align="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack justifyContent="space-between">
        <Skeleton height={9} width={48} />
        <Skeleton height={10} width={28} />
      </HStack>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="88px" />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="120px" />
        ))}
      </SimpleGrid>
    </VStack>
  );
}
