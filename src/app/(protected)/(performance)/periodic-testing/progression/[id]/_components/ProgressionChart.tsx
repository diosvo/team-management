'use client';

import { useTranslations } from 'next-intl';
import { Chart, useChart } from '@chakra-ui/charts';
import { Box, Text } from '@chakra-ui/react';
import type { TooltipContentProps } from 'recharts';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatDate } from '@/utils/datetime';
import { formatResult } from '@/utils/progression';

import type { PlayerTypeProgression } from '@/types/periodic-testing';

type Point = PlayerTypeProgression['history'][number];

function CustomTooltip({
  active,
  payload,
  unit,
}: Partial<TooltipContentProps<string, string>> & { unit: string }) {
  const t = useTranslations('periodicTesting.playerProgression');

  const [first] = payload ?? [];
  if (!active || !first) return null;

  const entry = first.payload as Point;

  return (
    <Box backgroundColor="white" padding={2} borderRadius="sm" boxShadow="sm">
      <Text fontWeight="medium" marginBottom={1}>
        {formatDate(entry.date)}
      </Text>
      <Text color="red.600">
        {t('chartPlayer', { value: formatResult(entry.result, unit) })}
      </Text>
      <Text color="GrayText">
        {t('chartTeamAverage', {
          value: formatResult(entry.team_average, unit),
        })}
      </Text>
    </Box>
  );
}

export default function ProgressionChart({
  progression,
}: {
  progression: PlayerTypeProgression;
}) {
  const t = useTranslations('periodicTesting.playerProgression');
  const { type, history } = progression;
  const chart = useChart({
    data: history.map((point) => ({
      ...point,
      short_date: formatDate(point.date),
    })),
    series: [
      { name: 'result', color: 'red.solid' },
      { name: 'team_average', color: 'gray.400' },
    ],
  });
  const target = type.target == null ? null : Number(type.target);

  return (
    <Chart.Root chart={chart} maxHeight="2xs">
      <LineChart data={chart.data} responsive>
        <CartesianGrid
          stroke={chart.color('border')}
          vertical={false}
          strokeDasharray="2 2"
        />
        <XAxis
          axisLine={false}
          dataKey={chart.key('short_date')}
          stroke={chart.color('border')}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={40}
          stroke={chart.color('border')}
          // Lower-is-better tests read upward as they improve.
          reversed={!type.higher_is_better}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip unit={type.unit} />} />
        {target != null && (
          <ReferenceLine
            y={target}
            stroke="orange"
            strokeDasharray="2 2"
            label={{
              value: t('chartTarget', { value: formatResult(target) }),
              position: 'top',
            }}
          />
        )}
        {progression.goal != null && (
          <ReferenceLine
            y={progression.goal}
            stroke="green"
            strokeDasharray="6 3"
            label={{
              value: t('chartGoal', { value: formatResult(progression.goal) }),
              position: 'bottom',
            }}
          />
        )}
        <Line
          isAnimationActive={false}
          dataKey={chart.key('team_average')}
          stroke={chart.color('gray.400')}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          dot={false}
        />
        <Line
          isAnimationActive={false}
          dataKey={chart.key('result')}
          stroke={chart.color('red.solid')}
          strokeWidth={2}
        />
      </LineChart>
    </Chart.Root>
  );
}
