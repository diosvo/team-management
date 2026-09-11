import { Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack gap={8}>
      <Skeleton height={9} width={48} />
      <SkeletonText noOfLines={6} gap={4} />
      <Skeleton height={9} width={40} />
      <SkeletonText noOfLines={10} gap={4} />
    </Stack>
  );
}
