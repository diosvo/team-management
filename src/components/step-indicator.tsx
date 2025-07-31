'use client';

import { Text } from '@chakra-ui/react';

export default function StepIndicator({ step }: { step: number }) {
  return (
    <Text
      as="span"
      paddingBlock={1}
      paddingInline={3}
      marginRight={2}
      color="white"
      borderRadius="full"
      backgroundColor="gray.fg"
    >
      {step}
    </Text>
  );
}
