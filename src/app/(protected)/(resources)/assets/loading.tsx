import { HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={6}>
      <Skeleton height={9} width={28} />
      <HStack gap={6}>
        <Skeleton width="326px" height="131px" />
        <Skeleton width="326px" height="131px" />
      </HStack>
      <Skeleton width="full" height="40px" />
      <SkeletonText noOfLines={5} gap={4} />
    </VStack>
  );
}
