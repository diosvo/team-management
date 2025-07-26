import { Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function AddResultLoading() {
  return (
    <VStack align="stretch" gap={6}>
      <Skeleton height={9} width={40} />
      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={6} gap={4} />
    </VStack>
  );
}
