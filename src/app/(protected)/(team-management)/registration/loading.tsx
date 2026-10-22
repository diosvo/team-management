import { GridItem, SimpleGrid, Skeleton } from '@chakra-ui/react';

import RegistrationIntro from './_components/RegistrationIntro';

export default function RegistrationLoading() {
  return (
    <>
      <RegistrationIntro />
      {/* RegistrationSteps: one row of step indicators. */}
      <Skeleton height={8} />
      {/* Players card (5 columns) beside the preview card (7 columns). */}
      <SimpleGrid columns={{ base: 1, lg: 12 }} gap={6} alignItems="start">
        <GridItem colSpan={{ base: 1, lg: 5 }}>
          <Skeleton height="170px" />
        </GridItem>
        <GridItem colSpan={{ base: 1, lg: 7 }}>
          <Skeleton height="170px" />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
