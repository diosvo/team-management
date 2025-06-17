import { HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      <Skeleton height={9} width={48} />
      <HStack gap={6} wrap="wrap">
        <Skeleton height="120px" flex={1} minWidth="200px" />
        <Skeleton height="120px" flex={1} minWidth="200px" />
        <Skeleton height="120px" flex={1} minWidth="200px" />
        <Skeleton height="120px" flex={1} minWidth="200px" />
      </HStack>
      <SkeletonText noOfLines={8} gap={4} />
    </VStack>
  );
}
