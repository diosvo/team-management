import { HStack, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <>
      {/* TeamHeader: page title + "Add" button */}
      <HStack justifyContent="space-between">
        <Skeleton height={{ base: 8, md: 10 }} width={40} />
        <Skeleton height={{ base: 8, md: 10 }} width={20} />
      </HStack>

      {/* SearchInput */}
      <Skeleton height={{ base: 8, md: 10 }} width="100%" />

      {/* TeamTable */}
      <Stack borderWidth={1} borderRadius="md" gap={4} padding={4}>
        <Skeleton height={6} width="100%" />
        <SkeletonText noOfLines={7} gap={4} />
      </Stack>
    </>
  );
}
