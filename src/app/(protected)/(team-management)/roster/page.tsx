import { getRoster } from '@/features/user/actions/user';
import { Box, Heading } from '@chakra-ui/react';
import { RosterTable } from './_components/roster-table';

export default async function RosterPage() {
  const users = await getRoster();

  return (
    <Box>
      <Heading as="h1" size="xl" mb={4}>
        Team Roster
      </Heading>

      <RosterTable users={users} />
    </Box>
  );
}
