import { HStack, Text, VStack } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

type InfoFieldProps = {
  label: string;
  icon?: React.ElementType;
  direction?: 'horizontal' | 'vertical';
};

export default function TextField({
  icon: IconComponent,
  label,
  children,
  direction = 'vertical',
}: PropsWithChildren<InfoFieldProps>) {
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
    <VStack gap={1} fontSize={14} alignItems="start">
      <HStack gap={1}>
        {IconComponent && <IconComponent size={14} color="GrayText" />}
        <Text color="GrayText">{label}</Text>
      </HStack>
      {children}
    </VStack>
  );
}
