'use client';

import { Field as ChakraField } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

export interface FieldProps extends Omit<ChakraField.RootProps, 'label'> {
  label: React.ReactNode;
  helperText: React.ReactNode;
  errorText: React.ReactNode;
  optionalText: React.ReactNode;
}

export const Field = React.forwardRef<HTMLDivElement, Partial<FieldProps>>(
  function Field(props, ref) {
    const { label, children, helperText, errorText, optionalText, ...rest } =
      props;
    const t = useTranslations('validation');
    // Schema messages are `validation` keys; anything else renders verbatim
    const error =
      typeof errorText === 'string' && t.has(errorText as never)
        ? t(errorText as never)
        : errorText;

    return (
      <ChakraField.Root ref={ref} {...rest}>
        {label && (
          <ChakraField.Label>
            {label}
            <ChakraField.RequiredIndicator fallback={optionalText} />
          </ChakraField.Label>
        )}
        {children}
        {helperText && (
          <ChakraField.HelperText>{helperText}</ChakraField.HelperText>
        )}
        {error && <ChakraField.ErrorText>{error}</ChakraField.ErrorText>}
      </ChakraField.Root>
    );
  },
);
