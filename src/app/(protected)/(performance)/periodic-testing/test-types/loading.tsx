import { HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function TestTypesLoading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      {/* TestTypesHeader: back button + title on the left, Add on the right */}
      <HStack justifyContent="space-between">
        <HStack gap={2}>
          <Skeleton height={10} width={10} />
          <Skeleton height={9} width={32} />
        </HStack>
        <Skeleton height={9} width={20} />
      </HStack>
      {/* TestTypesFilters: search + unit filter */}
      <Skeleton height={10} width="100%" />
      {/* TestTypesTable */}
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </VStack>
  );
}
