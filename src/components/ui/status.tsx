import * as React from 'react';

import type { ColorPalette } from '@chakra-ui/react';
import { Status as ChakraStatus } from '@chakra-ui/react';

export interface StatusProps extends ChakraStatus.RootProps {
  colorPalette: ColorPalette;
}

export const Status = React.forwardRef<HTMLDivElement, StatusProps>(
  function Status(props, ref) {
    const { children, colorPalette, ...rest } = props;
    return (
      <ChakraStatus.Root ref={ref} {...rest} colorPalette={colorPalette}>
        <ChakraStatus.Indicator />
        {children}
      </ChakraStatus.Root>
    );
  }
);
