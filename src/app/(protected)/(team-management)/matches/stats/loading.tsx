import { getTranslations } from 'next-intl/server';
import { SimpleGrid, Skeleton } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

export default async function MatchStatsLoading() {
  const t = await getTranslations('matches.boxScore');

  return (
    <>
      <PageTitle title={t('title')} />
      {/* Match & players card beside the box score card. */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={6}
        templateColumns={{ lg: '1fr 2fr' }}
      >
        <Skeleton height="320px" />
        <Skeleton height="320px" />
      </SimpleGrid>
    </>
  );
}
