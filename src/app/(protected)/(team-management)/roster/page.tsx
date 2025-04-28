import { Metadata } from 'next';

import { Box, Heading } from '@chakra-ui/react';
import { Suspense } from 'react';
import RosterActions from './_components/roster-actions';
import RosterMain from './_components/roster-main';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default async function RosterPage(
  props: Partial<{
    searchParams: Promise<{
      q: string;
    }>;
  }>
) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  return (
    <Box>
      <Heading as="h1" size="xl">
        Team Roster
      </Heading>
      <RosterActions />
      <Suspense key={query} fallback={<div>Roster Loading...</div>}>
        <RosterMain query={query} />
      </Suspense>
    </Box>
  );
}
