import { SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      <Skeleton height={9} width="2xs" />
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={6}
        templateColumns={{ lg: '3fr 7fr' }}
      >
        <Skeleton height="md" width="full" />
        <Skeleton height="md" width="full" />
      </SimpleGrid>
    </VStack>
  );
}
