'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { Chart, useChart } from '@chakra-ui/charts';
import { Link } from '@chakra-ui/react';
import { ChartColumnBig } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Tooltip,
  XAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import type { MatchesRateRecord } from '@/types/analytics';

export default function MatchesRate({
  records,
}: {
  records: Array<MatchesRateRecord>;
}) {
  const router = useRouter();
  const chart = useChart({
    data: records,
    series: [
      { name: 'league', color: 'purple.400' },
      { name: 'friendly', color: 'teal.400' },
    ],
  });

  const isEmpty = Object.entries(records).every(
    ([_, { league, friendly }]) => !league && !friendly,
  );

  return (
    <Card
      title="Matches Record"
      description="Performance in league vs friendly matches"
      action={
        <Link textStyle="secondary" colorPalette="blue" asChild>
          <NextLink href="/matches">View Matches</NextLink>
        </Link>
      }
    >
      {isEmpty ? (
        <EmptyState icon={<ChartColumnBig />} title="No matches records" />
      ) : (
        <Chart.Root chart={chart} maxHeight="sm">
          <BarChart data={chart.data} responsive>
            <CartesianGrid
              stroke={chart.color('border.muted')}
              vertical={false}
              strokeDasharray="2 2"
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key('outcome')}
            />
            <Tooltip
              content={<Chart.Tooltip />}
              cursor={{ fill: chart.color('bg.muted') }}
            />
            <Legend content={<Chart.Legend />} />
            {chart.series.map((item) => (
              <Bar
                key={item.name}
                stackId={item.stackId}
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={chart.color(item.color)}
                stroke={chart.color(item.color)}
                cursor="pointer"
                onClick={() => router.push(`/matches?match_type=${item.name}`)}
              >
                <LabelList position="top" dataKey={chart.key(item.name)} />
              </Bar>
            ))}
          </BarChart>
        </Chart.Root>
      )}
    </Card>
  );
}
