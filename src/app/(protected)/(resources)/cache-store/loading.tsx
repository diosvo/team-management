import { Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack alignItems="stretch" gap={6}>
      <Skeleton height={9} width={28} />
      <SkeletonText noOfLines={5} gap={4} />
    </VStack>
  );
}
