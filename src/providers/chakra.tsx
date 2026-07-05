'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { PropsWithChildren, useRef, useState } from 'react';

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

  const flushedRef = useRef(new Set<string>());

  useServerInsertedHTML(() => {
    const flushed = flushedRef.current;
    const newNames: Array<string> = [];
    const newStyles: Array<string> = [];

    for (const [name, style] of Object.entries(cache.inserted)) {
      if (!flushed.has(name)) {
        flushed.add(name);
        newNames.push(name);
        if (typeof style === 'string') {
          newStyles.push(style);
        }
      }
    }

    if (newNames.length === 0) return null;

    return (
      <style
        data-emotion={`${cache.key} ${newNames.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: newStyles.join(' ') }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
