'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@chakra-ui/react';

/**
 * recharts (~300KB min) must stay out of the route's first-load JS, so each
 * chart loads in its own client-only chunk. `ssr: false` requires a client
 * module — that is this file's only job.
 */
const loading = () => <Skeleton height="320px" borderRadius="md" />;

export const MatchesRate = dynamic(() => import('./MatchesRate'), {
  ssr: false,
  loading,
});

export const AttendanceTrend = dynamic(() => import('./AttendanceTrend'), {
  ssr: false,
  loading,
});

export const AbsenceReasonsBreakdown = dynamic(
  () => import('./AbsenceReasonsBreakdown'),
  {
    ssr: false,
    loading,
  },
);
