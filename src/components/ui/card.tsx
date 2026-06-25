import { ReactNode } from 'react';

import { Card as ChakraCard } from '@chakra-ui/react';

export interface CardProps extends Omit<ChakraCard.RootProps, 'title'> {
  title: ReactNode;
  description?: ReactNode;
}

export function Card({ title, description, children, ...rest }: CardProps) {
  return (
    <ChakraCard.Root {...rest}>
      <ChakraCard.Header>
        <ChakraCard.Title>{title}</ChakraCard.Title>
        {description && (
          <ChakraCard.Description>{description}</ChakraCard.Description>
        )}
      </ChakraCard.Header>
      <ChakraCard.Body>{children}</ChakraCard.Body>
    </ChakraCard.Root>
  );
}
