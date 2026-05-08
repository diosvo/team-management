'use client';

import { MatchesRateRecord } from '@/types/analytics';
import { Chart, useChart } from '@chakra-ui/charts';
import { Card } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Tooltip,
  XAxis,
} from 'recharts';

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

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Matches Record</Card.Title>
        <Card.Description>
          Performance in league vs friendly matches
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <Chart.Root chart={chart}>
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
                dataKey={chart.key(item.name)}
                fill={chart.color(item.color)}
                stroke={chart.color(item.color)}
                onClick={() => router.push(`/matches?type=${item.name}`)}
              >
                <LabelList position="top" dataKey={chart.key(item.name)} />
              </Bar>
            ))}
          </BarChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
