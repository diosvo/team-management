'use client';

import { PropsWithChildren } from 'react';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig, {
  strictTokens: true,
  theme: {
    tokens: {
      colors: {
        primary: { value: '#8c271e' },
      },
    },
  },
  globalCss: {
    'html, body': {
      maxWidth: '100vw',
      overflowX: 'hidden',
    },
  },
});

export default function UiProvider({ children }: PropsWithChildren) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
