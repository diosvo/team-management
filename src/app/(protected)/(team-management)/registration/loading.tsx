import { HStack, Skeleton, VStack } from '@chakra-ui/react';

export default function RegistrationLoading() {
  return (
    <VStack alignItems="stretch" gap={6}>
      <Skeleton height={9} width="280px" />
      <HStack gap={6}>
        <Skeleton height="170px" flex={1} />
        <Skeleton height="170px" flex={1} />
      </HStack>
    </VStack>
  );
}
