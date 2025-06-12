import { HStack, Skeleton } from '@chakra-ui/react';

export default function ProfileSkeleton() {
  return (
    <HStack gap={6}>
      <Skeleton height="266px" flex={1} />
      <Skeleton height="266px" flex={1} />
    </HStack>
  );
}
