import { Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack gap={{ base: 4, lg: 6 }}>
      <Skeleton height={9} width={28} />
      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={6} gap={4} />
    </Stack>
  );
}
