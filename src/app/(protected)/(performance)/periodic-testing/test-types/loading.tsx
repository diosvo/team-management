import { HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function TestTypesLoading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack justifyContent="space-between">
        <HStack gap={2}>
          <Skeleton height={10} width={10} />
          <Skeleton height={9} width={32} />
        </HStack>
        <Skeleton height={9} width={20} />
      </HStack>
      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </VStack>
  );
}
