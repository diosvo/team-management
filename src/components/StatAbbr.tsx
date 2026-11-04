'use client';

import { Span } from '@chakra-ui/react';

import { Tooltip } from '@/components/ui/tooltip';

/**
 * Short stat label with hover/focus expansion and a screen-reader name.
 */
export default function StatAbbr({
  short,
  label,
}: {
  short: string;
  label: string;
}) {
  return (
    <Tooltip showArrow content={label}>
      <Span
        tabIndex={0}
        aria-label={label}
        cursor="help"
        textDecoration="underline dotted"
        textUnderlineOffset="3px"
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'colorPalette.focusRing',
        }}
      >
        {short}
      </Span>
    </Tooltip>
  );
}
