import { Skeleton, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      {/* PageTitle */}
      <Skeleton height={9} width={48} />
    </VStack>
  );
}
