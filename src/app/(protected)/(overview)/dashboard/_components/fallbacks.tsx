import { Skeleton } from '@chakra-ui/react';

/* Section fallbacks, shared with `loading.tsx` to reserve the same space. */

export function CardFallback() {
  return <Skeleton height="180px" borderRadius="md" />;
}

export function ChartFallback() {
  return <Skeleton height="320px" borderRadius="md" />;
}
