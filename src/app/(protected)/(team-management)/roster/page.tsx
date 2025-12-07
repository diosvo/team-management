import { Metadata } from 'next';

import { getRoster } from '@/actions/user';
import PageTitle from '@/components/PageTitle';

import RosterList from './_components/RosterList';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default async function RosterPage() {
  const users = await getRoster();

  return (
    <>
      <PageTitle>Team Roster</PageTitle>
      <RosterList users={users} />
    </>
  );
}
