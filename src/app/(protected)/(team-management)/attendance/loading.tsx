import {
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stat,
  VStack,
} from '@chakra-ui/react';

export default function AttendanceLoading() {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack justifyContent="space-between">
        <Skeleton height={9} width={56} />
        <Skeleton height={9} width={44} />
      </HStack>
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Stat.Root key={index}>
            <Skeleton width="full" height="90px" />
          </Stat.Root>
        ))}
      </SimpleGrid>
      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </VStack>
  );
}
