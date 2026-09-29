'use client';

import dynamic from 'next/dynamic';

import { ChartSkeleton } from './PerformanceSkeleton';

/**
 * Lazy-load charts to keep the route light.
 * Skeletons prevent layout jumps while chunks load.
 */
const loading = () => <ChartSkeleton />;

export const AttendanceTrendChart = dynamic(
  () => import('./attendance/AttendanceTrendChart'),
  { ssr: false, loading },
);

export const TestProgressChart = dynamic(
  () => import('./testing/TestProgressChart'),
  {
    ssr: false,
    loading,
  },
);

export const TestRadarChart = dynamic(
  () => import('./testing/TestRadarChart'),
  {
    ssr: false,
    loading,
  },
);

export const MatchStatsChart = dynamic(
  () => import('./matches/MatchStatsChart'),
  {
    ssr: false,
    loading,
  },
);
