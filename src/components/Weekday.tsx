'use client';

import { useLocale } from 'next-intl';
import { chakra, type HTMLChakraProps } from '@chakra-ui/react';

import { formatDay } from '@/utils/datetime';

// 1-7 Jan 2024 runs Monday to Sunday: every weekday once.
const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

// Short names (`Thu`, `T5`) keep the reserved box tight, so no gap trails it.
const SHORT_DAY_FORMAT = 'EEE';

export default function Weekday({
  date,
  ...props
}: { date: string } & HTMLChakraProps<'span'>) {
  const locale = useLocale();
  const day = formatDay(date, SHORT_DAY_FORMAT, locale);

  return (
    <chakra.span display="inline-grid" color="fg.muted" {...props}>
      {WEEK.map((weekday) => {
        const name = formatDay(weekday, SHORT_DAY_FORMAT, locale);
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
