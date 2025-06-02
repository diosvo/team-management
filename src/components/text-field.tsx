import { HStack, Text, VStack } from '@chakra-ui/react';

interface InfoFieldProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  direction?: 'horizontal' | 'vertical';
}

export default function TextField({
  icon: IconComponent,
  label,
  children,
  direction = 'vertical',
}: InfoFieldProps) {
  if (direction === 'horizontal') {
    return (
      <HStack gap={1} fontSize={14}>
        {IconComponent && <IconComponent size={14} color="GrayText" />}
        <Text color="GrayText">{label}:</Text>
        {children}
      </HStack>
    );
  }

  return (
    <VStack align="start">
      <HStack gap={1}>
        {IconComponent && <IconComponent size={14} color="GrayText" />}
        <Text color="GrayText" fontSize={14}>
          {label}
        </Text>
      </HStack>
      {children}
    </VStack>
  );
}
