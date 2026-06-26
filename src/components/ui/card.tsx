import { ReactNode } from 'react';

import { Card as ChakraCard, Flex } from '@chakra-ui/react';

export interface CardProps extends Omit<ChakraCard.RootProps, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Card({
  title,
  description,
  action,
  footer,
  children,
  ...rest
}: CardProps) {
  return (
    <ChakraCard.Root {...rest}>
      <ChakraCard.Header>
        {action ? (
          <Flex justifyContent="space-between" alignItems="center" gap={2}>
            <ChakraCard.Title>{title}</ChakraCard.Title>
            {action}
          </Flex>
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
