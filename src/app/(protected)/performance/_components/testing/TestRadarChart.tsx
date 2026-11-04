'use client';

import { Chart, useChart } from '@chakra-ui/charts';
import { useTranslations } from 'next-intl';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from 'recharts';

export type RadarPoint = { name: string; percentile: number };

/** Percentile per test type on the player's latest testing date. */
export default function TestRadarChart({
  points,
}: {
  points: Array<RadarPoint>;
}) {
  const t = useTranslations('performance.testing');
  const chart = useChart({
    data: points,
    series: [{ name: 'percentile', color: 'blue.500', label: t('percentile') }],
  });

  return (
    <Chart.Root chart={chart} maxHeight="sm">
      <RadarChart data={chart.data} responsive>
        <PolarGrid stroke={chart.color('border')} />
        <PolarAngleAxis dataKey={chart.key('name')} fontSize={12} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip content={<Chart.Tooltip />} />
        <Radar
          isAnimationActive={false}
          dataKey={chart.key('percentile')}
          stroke={chart.color('blue.500')}
          fill={chart.color('blue.500')}
          fillOpacity={0.3}
        />
      </RadarChart>
    </Chart.Root>
  );
}
