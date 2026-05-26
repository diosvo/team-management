import {
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stat,
  VStack,
} from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <Skeleton height={9} width={28} />
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
        <Stat.Root>
          <Skeleton width="full" height="90px" />
        </Stat.Root>
        <Stat.Root>
          <Skeleton width="full" height="90px" />
        </Stat.Root>
        <Stat.Root>
          <Skeleton width="full" height="90px" />
        </Stat.Root>
      </SimpleGrid>
      <Skeleton width="full" height="40px" />
      <SkeletonText noOfLines={5} gap={4} />
    </VStack>
  );
}
