import { HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack justifyContent="space-between">
        <Skeleton height={9} width={48} />
        <Skeleton height={9} width={28} />
      </HStack>
      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </VStack>
  );
}
