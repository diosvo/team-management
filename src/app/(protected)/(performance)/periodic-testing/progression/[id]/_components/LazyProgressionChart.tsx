'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@chakra-ui/react';

/** Keeps recharts out of the route's first-load JS (see dashboard `LazyCharts`). */
const LazyProgressionChart = dynamic(() => import('./ProgressionChart'), {
  ssr: false,
  loading: () => <Skeleton height="256px" borderRadius="md" />,
});

export default LazyProgressionChart;
