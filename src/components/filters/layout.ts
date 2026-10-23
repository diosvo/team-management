import type { StackProps } from '@chakra-ui/react';

/*
 * Toolbar layout shared by `Filters` and `FiltersSkeleton`. Not in a
 * `'use client'` module, so server `loading.tsx` files can import it.
 */

/** Gap between toolbar controls. */
const GAP = { base: 3, lg: 4 } as const;

/** Control height: 36px on phones, 40px from `md`. */
export const CONTROL_HEIGHT = { base: 9, md: 10 } as const;

export const TOOLBAR_PROPS: StackProps = { gap: GAP, flexWrap: 'wrap' };

/** Search: own row on phones, shared from `md`. */
export const SEARCH_SLOT_PROPS: StackProps = {
  flexGrow: 1,
  flexBasis: { base: 'full', md: 'auto' },
  minWidth: 0,
};

/** Date, Filters, actions: end row on phones; after search from `md`. */
export const CONTROLS_ROW_PROPS: StackProps = {
  gap: GAP,
  flexGrow: { base: 1, md: 0 },
  flexBasis: { base: 'full', md: 'auto' },
  justifyContent: { base: 'flex-end', md: 'flex-start' },
  minWidth: 0,
};
