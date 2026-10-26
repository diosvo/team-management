import { SimpleGrid, Skeleton } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';

import PageTitle from '@/components/PageTitle';

export default async function Loading() {
  const t = await getTranslations('periodicTesting.addResult');

  return (
    <>
      <PageTitle title={t('title')} />
      {/* Configuration card beside the results card. */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={6}
        templateColumns={{ lg: '1fr 2fr' }}
      >
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} height="md" />
        ))}
      </SimpleGrid>
    </>
  );
}
