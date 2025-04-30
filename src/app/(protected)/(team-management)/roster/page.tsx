import { Metadata } from 'next';
import { Suspense } from 'react';

import Loading from '@/components/loading';
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

  return (
    <Suspense key={query || roles || state} fallback={<Loading />}>
      <RosterMain
        params={{
          query,
          roles: rolesArray,
          state: stateArray,
        }}
      />
    </Suspense>
  );
}
