import { Metadata } from 'next';

import { VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import PeriodicTestingPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default function PeriodicTestingPage() {
  return (
    <VStack align="stretch">
      <PageTitle>Periodic Testing</PageTitle>

      <PeriodicTestingPageClient />
    </VStack>
  );
}
