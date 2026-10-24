import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SimpleGrid } from '@chakra-ui/react';
import { TrendingUp } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Stat, StatGroup } from '@/components/ui/stat';

import { getPlayerProgressionById } from '@/actions/progression';
import { PerformanceBand, ProgressStatus } from '@/utils/enum';

import PlayerProgressionHeader from './_components/PlayerProgressionHeader';
import TestHistory from './_components/TestHistory';
import TestNotes from './_components/TestNotes';
import TypeProgressionCard from './_components/TypeProgressionCard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('periodicTesting.playerProgression.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function PlayerProgressionPage({
  params,
}: PageProps<'/periodic-testing/progression/[id]'>) {
  const { id } = await params;
  const [t, tStats] = await Promise.all([
    getTranslations('periodicTesting.playerProgression'),
    getTranslations('periodicTesting.stats'),
  ]);
  const { player_id, player_name, types, notes, test_types } =
    await getPlayerProgressionById(id);

  const count = (predicate: (item: (typeof types)[number]) => boolean) =>
    types.filter(predicate).length;
  const improving = count(({ status }) => status === ProgressStatus.IMPROVING);
  const regressing = count(
    ({ status }) => status === ProgressStatus.REGRESSING,
  );
  const onTarget = count(
    ({ band }) =>
      band === PerformanceBand.ELITE || band === PerformanceBand.ON_TARGET,
  );

  return (
    <>
      <PlayerProgressionHeader
        playerId={player_id}
        playerName={player_name}
        types={test_types}
        usedTypeIds={notes.flatMap(({ type_id }) => type_id ?? [])}
      />
      <StatGroup>
        <Stat
          label={t('testsTracked')}
          value={types.length}
          unit={tStats('testUnit')}
        />
        <Stat
          label={t('improving')}
          value={improving}
          unit={tStats('testUnit')}
          color={improving > 0 ? 'green' : 'black'}
        />
        <Stat
          label={t('regressing')}
          value={regressing}
          unit={tStats('testUnit')}
          color={regressing > 0 ? 'red' : 'black'}
        />
        <Stat
          label={t('onTarget')}
          value={onTarget}
          unit={tStats('testUnit')}
        />
      </StatGroup>
      {types.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <SimpleGrid columns={{ sm: 1, lg: 2, xl: 3 }} gap={6}>
          {types.map((progression) => (
            <TypeProgressionCard
              key={progression.type.type_id}
              progression={progression}
            />
          ))}
        </SimpleGrid>
      )}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {types.length > 0 && <TestHistory types={types} />}
        <TestNotes playerId={player_id} notes={notes} types={test_types} />
      </SimpleGrid>
    </>
  );
}
