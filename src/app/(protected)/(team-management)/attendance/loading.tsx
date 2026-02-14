import {
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
} from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack>
      <HStack justifyContent="space-between" marginBottom={6}>
        <Skeleton height={9} width="240px" />
        <HStack marginLeft="auto" gap={4}>
          <Skeleton height={9} width="174px" />
          <Skeleton height={9} width="174px" />
        </HStack>
      </HStack>
      <SimpleGrid
        columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
        gap={6}
        marginBlock={6}
      >
        <Skeleton height="131px" />
        <Skeleton height="131px" />
        <Skeleton height="131px" />
        <Skeleton height="131px" />
      </SimpleGrid>
      <Skeleton width="full" height="40px" marginBlock={4} />
      <SkeletonText noOfLines={5} gap={4} />
    </Stack>
  );
}
