import { HStack, Separator, Span, Text, VStack } from '@chakra-ui/react';

export default function AchievementFooter() {
  return (
    <HStack gap={{ base: 4, md: 8 }}>
      <Separator flex={1} borderColor="gray.200" />
      <VStack gap={0} textAlign="center">
        <Text fontSize="sm">
          <Span>More than victories.</Span>
          <Span fontWeight="bold" color="primary" marginLeft={2}>
            This is our journey.
          </Span>
        </Text>
      </VStack>
      <Separator flex={1} borderColor="gray.200" />
    </HStack>
  );
}
