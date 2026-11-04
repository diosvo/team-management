'use client';

import { chakra, type HTMLChakraProps } from '@chakra-ui/react';
import { useLocale } from 'next-intl';

import { formatDay } from '@/utils/datetime';

// 1-7 Jan 2024 runs Monday to Sunday: every weekday once.
const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

/**
 * The weekday of `date`, in a box as wide as the locale's longest weekday
 * name, so date columns line up in any font. Every name shares one grid cell
 * and only the matching one is visible.
 */
export default function Weekday({
  date,
  ...props
}: { date: string } & HTMLChakraProps<'span'>) {
  const locale = useLocale();
  const day = formatDay(date, undefined, locale);

  return (
    <chakra.span display="inline-grid" {...props}>
      {WEEK.map((weekday) => {
        const name = formatDay(weekday, undefined, locale);
        return (
          <chakra.span
            key={name}
            gridArea="1 / 1"
            visibility={name === day ? 'visible' : 'hidden'}
            aria-hidden={name !== day}
          >
            {name}
          </chakra.span>
        );
      })}
    </chakra.span>
  );
}
