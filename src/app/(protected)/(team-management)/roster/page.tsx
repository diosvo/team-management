import { Metadata } from 'next';

import { getRoster } from '@/actions/user';

import RosterFilters from './_components/RosterFilters';
import RosterHeader from './_components/RosterHeader';
import RosterTable from './_components/RosterTable';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default async function RosterPage() {
  const users = await getRoster();

  return (
    <>
      <RosterHeader />
      <RosterFilters />
      <RosterTable users={users} />
    </>
  );
}
