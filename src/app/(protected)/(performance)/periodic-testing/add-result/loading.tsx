import { HStack, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack gap={2}>
        <Skeleton height={10} width={10} />
        <Skeleton height={9} width={48} />
      </HStack>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={6}
        templateColumns={{ lg: '1fr 2fr' }}
      >
        <Skeleton height="md" width="full" />
        <Skeleton height="md" width="full" />
      </SimpleGrid>
    </VStack>
  );
}
