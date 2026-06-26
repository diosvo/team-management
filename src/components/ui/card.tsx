import { Card as ChakraCard, HStack } from '@chakra-ui/react';

export type CardProps = Omit<ChakraCard.RootProps, 'title'> &
  Required<{
    title: React.ReactNode;
  }> &
  Partial<{
    description: React.ReactNode;
    action: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
  }>;

export function Card({
  title,
  description,
  action,
  footer,
  children,
  ...rest
}: CardProps) {
  return (
    <ChakraCard.Root {...rest} size="sm">
      <ChakraCard.Header>
        {action ? (
          <HStack justifyContent="space-between" alignItems="start">
            <ChakraCard.Title>{title}</ChakraCard.Title>
            {action}
          </HStack>
        ) : (
          <ChakraCard.Title>{title}</ChakraCard.Title>
        )}
        {description && (
          <ChakraCard.Description>{description}</ChakraCard.Description>
        )}
      </ChakraCard.Header>
      <ChakraCard.Body>{children}</ChakraCard.Body>
      {footer && <ChakraCard.Footer>{footer}</ChakraCard.Footer>}
    </ChakraCard.Root>
  );
}
