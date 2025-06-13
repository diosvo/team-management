import type { ButtonProps } from '@chakra-ui/react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import { X } from 'lucide-react';
import * as React from 'react';

export type CloseButtonProps = ButtonProps;

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  CloseButtonProps
>(function CloseButton(props, ref) {
  return (
    <ChakraIconButton
      size="2xs"
      focusRing="none"
      variant="ghost"
      borderRadius="full"
      aria-label="Close"
      ref={ref}
      {...props}
    >
      {props.children ?? <X />}
    </ChakraIconButton>
  );
});
