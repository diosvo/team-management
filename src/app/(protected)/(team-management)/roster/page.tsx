import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getRoster } from '@/actions/user';

import RosterFilters from './_components/RosterFilters';
import RosterHeader from './_components/RosterHeader';
import RosterTable from './_components/RosterTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('roster.metadata');
  return { title: t('title'), description: t('description') };
}

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
