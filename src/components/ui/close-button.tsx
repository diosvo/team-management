import type { ButtonProps } from '@chakra-ui/react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

export type CloseButtonProps = ButtonProps;

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  CloseButtonProps
>(function CloseButton(props, ref) {
  const t = useTranslations('components.closeButton');
  return (
    <ChakraIconButton
      focusRing="none"
      variant="ghost"
      aria-label={t('close')}
      ref={ref}
      {...props}
    >
      {props.children ?? <X />}
    </ChakraIconButton>
  );
});
