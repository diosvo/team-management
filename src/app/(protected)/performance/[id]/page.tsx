import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { UserRoundX } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { verifySession } from '@/actions/auth';
import { getPerformanceIdentity } from '@/actions/player-performance';
import { loadPerformanceFilters } from '@/lib/nuqs';
import type { DateRange } from '@/types/common';

import PerformanceHeader from '../_components/PerformanceHeader';
import {
  ActivitySkeleton,
  AttendanceSkeleton,
  BodySkeleton,
  HeaderSkeleton,
  MatchesSkeleton,
  StatsSkeleton,
  TestingSkeleton,
} from '../_components/PerformanceSkeleton';
import PerformanceStats from '../_components/PerformanceStats';
import PerformanceTabs from '../_components/PerformanceTabs';
import {
  ActivitySection,
  AttendanceSection,
  MatchesSection,
  TestingSection,
} from '../_components/Sections';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('performance.metadata');
  return { title: t('title'), description: t('description') };
}

/*
 * The shell renders immediately; each section streams in with a matching
 * skeleton. The player lookup is request-cached, so the header and body share
 * one query.
 */
export default async function PerformancePage({
  params,
  searchParams,
}: PageProps<'/performance/[id]'>) {
  // No database work: params, the URL, and the cached session.
  const [{ id }, { from, to, tab }, session, t] = await Promise.all([
    params,
    loadPerformanceFilters(searchParams),
    verifySession(),
    getTranslations('performance.page'),
  ]);
  const title = session?.user.id === id ? t('ownTitle') : t('title');

  return (
    <>
      <Suspense fallback={<HeaderSkeleton title={title} />}>
        <HeaderSection id={id} />
      </Suspense>
      <Suspense fallback={<BodySkeleton tab={tab} />}>
        <BodySection id={id} range={{ from, to }} />
      </Suspense>
    </>
  );
}

async function HeaderSection({ id }: { id: string }) {
  const identity = await getPerformanceIdentity(id);
  return <PerformanceHeader identity={identity} />;
}

async function BodySection({ id, range }: { id: string; range: DateRange }) {
  const [identity, t] = await Promise.all([
    getPerformanceIdentity(id),
    getTranslations('performance.page'),
  ]);

  if (!identity.is_player) {
    return (
      <Card title={t('notPlayer.title')}>
        <EmptyState
          icon={<UserRoundX />}
          title={
            identity.is_own
              ? t('notPlayer.own')
              : t('notPlayer.other', { name: identity.name })
          }
          description={t('notPlayer.description')}
        />
      </Card>
    );
  }

  // Who the charts compare against: "You" on your own page, otherwise the player's name.
  const subject = identity.is_own ? t('you') : identity.name;

  return (
    <>
      <Suspense fallback={<StatsSkeleton />}>
        <PerformanceStats target_id={id} range={range} />
      </Suspense>

      <PerformanceTabs
        attendance={
          <Suspense fallback={<AttendanceSkeleton />}>
            <AttendanceSection target_id={id} range={range} subject={subject} />
          </Suspense>
        }
        testing={
          <Suspense fallback={<TestingSkeleton />}>
            <TestingSection target_id={id} subject={subject} />
          </Suspense>
        }
        activity={
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection target_id={id} range={range} />
          </Suspense>
        }
        matches={
          <Suspense fallback={<MatchesSkeleton />}>
            <MatchesSection target_id={id} range={range} />
          </Suspense>
        }
      />
    </>
  );
}
