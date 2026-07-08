import { Metadata } from 'next';

import { getTeams } from '@/actions/team';
import SearchInput from '@/components/SearchInput';

import TeamHeader from './_components/TeamHeader';
import TeamTable from './_components/TeamTable';

export const metadata: Metadata = {
  title: 'Teams',
  description: 'Manage and view opponent teams information.',
};

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <>
      <TeamHeader />
      <SearchInput />
      <TeamTable teams={teams} />
    </>
  );
}
