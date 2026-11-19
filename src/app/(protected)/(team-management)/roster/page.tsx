import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import env from '@env';

import { getJerseyOrderSheet, getPaymentEditors } from '@/actions/jersey-order';
import { getRoster } from '@/actions/user';

import RosterFilters from './_components/RosterFilters';
import RosterHeader from './_components/RosterHeader';
import RosterTable from './_components/RosterTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('roster.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function RosterPage() {
  const [users, jerseySheet, paymentEditors] = await Promise.all([
    getRoster(),
    getJerseyOrderSheet(),
    getPaymentEditors(),
  ]);

  return (
    <>
      <RosterHeader
        users={users}
        googleClientId={env.GOOGLE_CLIENT_ID}
        jerseySheet={jerseySheet}
        paymentEditors={paymentEditors}
      />
      <RosterFilters />
      <RosterTable users={users} />
    </>
  );
}
