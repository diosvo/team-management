import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getTeams } from '@/actions/team';
import SearchInput from '@/components/SearchInput';

import TeamHeader from './_components/TeamHeader';
import TeamTable from './_components/TeamTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('teams.metadata');
  return { title: t('title'), description: t('description') };
}

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
