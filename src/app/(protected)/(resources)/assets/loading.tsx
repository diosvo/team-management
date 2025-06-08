import { HStack, Skeleton, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      <Skeleton height={9} width={36} />
      <HStack gap={6}>
        AAAAAAAA
        <Skeleton height="266px" flex={1} />
        <Skeleton height="266px" flex={1} />
      </HStack>
    </VStack>
  );
}
