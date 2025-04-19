import { Metadata } from 'next';
import { Suspense } from 'react';

import { Box, Heading } from '@chakra-ui/react';

import { getRoster } from '@/features/user/actions/user';
import { RosterTable } from './_components/roster-table';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default async function RosterPage() {
  const users = await getRoster();

  return (
    <Box>
      <Heading as="h1" size="xl" mb={4}>
        Team Roster
      </Heading>
      <Suspense fallback={<div>Loading...</div>}>
        <RosterTable users={users} />
      </Suspense>
    </Box>
  );
}
