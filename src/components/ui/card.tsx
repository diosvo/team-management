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
  // A card without a title (e.g. the avatar card) would otherwise render an
  // empty `<h3>`, which axe flags as `empty-heading`.
  const heading = title ? <ChakraCard.Title>{title}</ChakraCard.Title> : null;

  return (
    <ChakraCard.Root {...rest} size="sm">
      {(heading || description || action) && (
        <ChakraCard.Header>
          {action ? (
            <HStack justifyContent="space-between" alignItems="start">
              {heading}
              {action}
            </HStack>
          ) : (
            heading
          )}
          {description && (
            <ChakraCard.Description>{description}</ChakraCard.Description>
          )}
        </ChakraCard.Header>
      )}
      <ChakraCard.Body>{children}</ChakraCard.Body>
      {footer && <ChakraCard.Footer>{footer}</ChakraCard.Footer>}
    </ChakraCard.Root>
  );
}
