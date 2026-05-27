import { Flex, Skeleton, SkeletonText } from '@chakra-ui/react';

export default function Loading() {
  return (
    <>
      <Flex justifyContent="space-between">
        <Skeleton height={9} width={32} />
        <Skeleton height={9} width={24} />
      </Flex>

      <Skeleton height={10} width="100%" />
      <SkeletonText noOfLines={7} gap={2} height={10} />
    </>
  );
}
