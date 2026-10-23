'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { type PropsWithChildren, useRef, useState } from 'react';

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  type SystemStyleObject,
} from '@chakra-ui/react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

type StyleMap = Record<string, unknown>;

/** Merge two style objects into `{ base: phone, md: full }` where they differ. */
function phoneThenFull(phone: StyleMap, full: StyleMap): StyleMap {
  return Object.fromEntries(
    Object.entries(full).map(([key, value]) => {
      const phoneValue = phone[key];
      if (value && typeof value === 'object') {
        return [
          key,
          phoneThenFull((phoneValue ?? {}) as StyleMap, value as StyleMap),
        ];
      }
      return [
        key,
        phoneValue === undefined || phoneValue === value
          ? value
          : { base: phoneValue, md: value },
      ];
    }),
  );
}

const BUTTON_SIZES = defaultConfig.theme?.recipes?.button?.variants
  ?.size as Record<string, StyleMap>;

/** Button size on phones (below `md`); `2xs` grows to a 32px tap target. */
const PHONE_BUTTON_SIZE = {
  '2xs': 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
  '2xl': 'xl',
} as const;

const RESPONSIVE_BUTTON_SIZES = Object.fromEntries(
  Object.entries(PHONE_BUTTON_SIZE).map(([size, phoneSize]) => [
    size,
    phoneThenFull(
      BUTTON_SIZES[phoneSize],
      BUTTON_SIZES[size],
    ) as SystemStyleObject,
  ]),
);

const system = createSystem(defaultConfig, {
  strictTokens: true,
  theme: {
    tokens: {
      colors: {
        primary: { value: '#8c271e' },
      },
    },
    recipes: {
      // Also covers IconButton, which shares the button recipe.
      button: { variants: { size: RESPONSIVE_BUTTON_SIZES } },
    },
    /** Text roles per device (phone, `md`, `lg`); prefer over `fontSize`. */
    textStyles: {
      // Default reading size: 16px on touch screens, 14px on laptop.
      body: { value: { fontSize: { base: 'md', lg: 'sm' } } },
      // Secondary text: card descriptions, list rows, table cells (14px).
      secondary: { value: { fontSize: 'sm' } },
      // Metadata: units, counts, timestamps, hints (12px).
      caption: { value: { fontSize: 'xs' } },
      // Uppercase section labels (12px phone/tablet, 10px laptop).
      overline: {
        value: {
          fontSize: { base: 'xs', lg: '2xs' },
          letterSpacing: 'wider',
          textTransform: 'uppercase',
        },
      },
    },
  },
  globalCss: {
    // iOS Safari zooms the page when focusing a field under 16px.
    'input, textarea, select': {
      mdDown: { fontSize: '16px !important' },
    },
    'html, body': {
      maxWidth: '100vw',
      // `clip` (not `hidden`): hidden forces overflow-y to `auto`, turning
      // body into a scroll container and silently disabling every
      // `position: sticky` descendant (e.g. the /docs sidebar).
      overflowX: 'clip',
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
