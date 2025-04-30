import { Metadata } from 'next';
import { Suspense } from 'react';

import { Box, Heading } from '@chakra-ui/react';

import { UserRole, UserState } from '@/utils/enum';

import RosterMain from './_components/main';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default async function RosterPage(
  props: Partial<{
    searchParams: Promise<{
      query: string;
      roles: string;
      state: string;
    }>;
  }>
) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const roles = searchParams?.roles || '';
  const state = searchParams?.state || '';
  const rolesArray = roles
    ? roles
        .split(',')
        .map((role) => UserRole[role as keyof typeof UserRole])
        .filter((role) => role !== UserRole.SUPER_ADMIN)
    : [];
  const stateArray = state
    ? state
        .split(',')
        .map((value) => UserState[value as keyof typeof UserState])
        .filter(Boolean)
    : [];

  return (
    <Box>
      <Heading as="h1" size="xl">
        Team Roster
      </Heading>
      <Suspense key={query || roles || state} fallback={<div>Loading...</div>}>
        <RosterMain
          params={{
            query,
            roles: rolesArray,
            state: stateArray,
          }}
        />
      </Suspense>
    </Box>
  );
}
