'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Chart, useChart } from '@chakra-ui/charts';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatDayHint } from '@/utils/datetime';

import { enumLabel } from '@/i18n/enums';
import type { TestTypeProgress } from '@/types/performance';

export default function TestProgressChart({
  type,
  subject,
}: {
  type: TestTypeProgress;
  /** Legend label for the player's line: "You" or their name. */
  subject: string;
}) {
  const t = useTranslations('performance.testing');
  const te = useTranslations('enums');
  const locale = useLocale();
  // Axis label per testing day: "8 Aug" / "8 thg 8".
  const data = useMemo(
    () =>
      type.series.map((point) => ({
        ...point,
        short_date: formatDayHint(point.date, locale),
      })),
    [type.series, locale],
  );
  const chart = useChart({
    data,
    series: [
      { name: 'result', color: 'blue.500', label: subject },
      {
        name: 'team_avg',
        color: 'gray.400',
        label: t('teamAverage'),
        strokeDasharray: '4 4',
      },
    ],
  });

  return (
    <Chart.Root chart={chart} maxHeight="sm">
      <LineChart data={chart.data} responsive>
        <CartesianGrid
          stroke={chart.color('border')}
          vertical={false}
          strokeDasharray="2 2"
        />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey={chart.key('short_date')}
          stroke={chart.color('border')}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={40}
          domain={['auto', 'auto']}
          label={{
            value: enumLabel(te, 'testTypeUnit', type.unit),
            angle: -90,
            position: 'insideLeft',
            fontSize: 12,
          }}
        />
        <Tooltip content={<Chart.Tooltip />} />
        <Legend content={<Chart.Legend />} />
        {chart.series.map((item) => (
          <Line
            key={item.name}
            type="monotone"
            connectNulls
            isAnimationActive={false}
            dataKey={chart.key(item.name)}
            stroke={chart.color(item.color)}
            strokeDasharray={item.strokeDasharray}
            strokeWidth={item.name === 'result' ? 2 : 1.5}
          />
        ))}
      </LineChart>
    </Chart.Root>
  );
}
