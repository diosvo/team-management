import { Skeleton, VStack } from '@chakra-ui/react';
import ProfileSkeleton from '../_components/profile-skeleton';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      <Skeleton height={9} width={36} />
      <ProfileSkeleton />
    </VStack>
  );
}
