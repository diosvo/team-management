import { useTranslations } from 'next-intl';

import { Skeleton, Text, VStack } from '@chakra-ui/react';

import { Card } from '@/components/ui/card';

/* Section fallbacks, shared with `loading.tsx` to reserve the same space. */

export function CardFallback() {
  return <Skeleton height="180px" borderRadius="md" />;
}

export function ChartFallback() {
  return <Skeleton height="320px" borderRadius="md" />;
}

export function UpcomingFallback({
  section,
}: {
  section: 'upcomingSessions' | 'upcomingMatches';
}) {
  const t = useTranslations(`dashboard.${section}`);

  return (
    <Card title={t('title')} description={t('description')}>
      <VStack alignItems="stretch" gap={4}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} borderRadius="sm">
            <VStack padding={4} gap={1}>
              <Text fontSize="sm">&nbsp;</Text>
              <Text fontSize="sm">&nbsp;</Text>
            </VStack>
          </Skeleton>
        ))}
      </VStack>
    </Card>
  );
}
