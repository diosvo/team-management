import { Metadata } from 'next';

import { HStack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { getTrainingSessions } from '@/actions/training-session';
import { loadTrainingFilters } from '@/utils/filters';

import SessionFilters from './_components/SessionFilters';
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
  const { stats, data } = await getTrainingSessions(params);

  return (
    <>
      <HStack justifyContent="space-between" marginBottom={6}>
        <PageTitle title="Training Sessions" />
        <SessionFilters />
      </HStack>

      <SessionStats stats={stats} />
      <SessionTable sessions={data} />
    </>
  );
}
