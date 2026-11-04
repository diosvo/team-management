import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { forbidden } from 'next/navigation';

import PageTitle from '@/components/PageTitle';

import {
  canEditMatchStats,
  getMatchPlayerStats,
  getPlayedMatches,
} from '@/actions/match';
import { getActivePlayers } from '@/actions/user';

import MatchStatsPageClient from './_components/MatchStatsPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('matches.boxScore.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function MatchStatsPage(
  props: PageProps<'/matches/stats'>,
) {
  const [isAllowed, { match }, matches, activePlayers, t] = await Promise.all([
    canEditMatchStats(),
    props.searchParams,
    getPlayedMatches(),
    getActivePlayers(),
    getTranslations('matches.boxScore'),
  ]);
  if (!isAllowed) forbidden();

  const matchId = typeof match === 'string' ? match : '';
  const initialMatch =
    matches.find(({ match_id }) => match_id === matchId) ?? null;
  const initialStats = initialMatch
    ? await getMatchPlayerStats(initialMatch.match_id)
    : [];

  return (
    <>
      <PageTitle title={t('title')} />
      <MatchStatsPageClient
        matches={matches}
        activePlayers={activePlayers}
        initialMatch={initialMatch}
        initialStats={initialStats}
      />
    </>
  );
}
