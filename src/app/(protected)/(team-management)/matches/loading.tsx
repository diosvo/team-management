import { SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={6}>
      <Skeleton height={9} width={28} />
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Skeleton height="2xs" />
        <Skeleton height="2xs" />
      </SimpleGrid>
      <Skeleton height="2xs" />
    </VStack>
  );
}
