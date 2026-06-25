'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { PropsWithChildren, useState } from 'react';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

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
  const [cache] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(' '),
      }}
    />
  ));

  return (
    <CacheProvider value={cache}>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
