import { Metadata } from 'next';

import { getSessions } from '@/actions/training-session';
import { loadTrainingFilters } from '@/lib/nuqs';

import SessionFilters from './_components/SessionFilters';
import SessionHeader from './_components/SessionHeader';
import SessionStats from './_components/SessionStats';
import SessionTable from './_components/SessionTable';

export const metadata: Metadata = {
  title: 'Training Sessions',
  description: 'Manage and schedule training sessions',
};

export default async function TrainingSessionsPage(
  props: PageProps<'/training'>,
) {
  const params = await loadTrainingFilters(props.searchParams);
  const { stats, data } = await getSessions(params);

  return (
    <>
      <SessionHeader />
      <SessionStats stats={stats} />
      <SessionFilters />
      <SessionTable sessions={data} />
    </>
  );
}
