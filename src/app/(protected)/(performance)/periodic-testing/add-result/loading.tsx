import { SimpleGrid, Skeleton } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

export default function Loading() {
  return (
    <>
      <PageTitle title="Add Test Result" />
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
