import { Metadata } from 'next';
import { Suspense } from 'react';

import { Box, Heading } from '@chakra-ui/react';

import { SelectableRole, SelectableState } from '@/utils/type';
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
        .map((role) => role as SelectableRole)
        .filter(Boolean)
    : [];
  const stateArray = state
    ? state
        .split(',')
        .map((value) => value as SelectableState)
        .filter(Boolean)
    : [];

  console.log(searchParams);

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
