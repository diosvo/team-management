import { SimpleGrid } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import UpcomingSessions from './_components/UpcomingSessions';

export default function DashboardPage() {
  return (
    <>
      <PageTitle title="Dashboard" />
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} marginBlock={6}>
        <UpcomingSessions />
      </SimpleGrid>
    </>
  );
}
