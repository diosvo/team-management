'use client';

import { useMemo } from 'react';

import { Chart, useChart } from '@chakra-ui/charts';
import { ChartPie } from 'lucide-react';
import { Pie, PieChart, PieSectorShapeProps, Sector } from 'recharts';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { AbsenceReason } from '@/types/analytics';

const CHART_COLORS = ['#8884D8', '#83A6ED', '#8DD1E1', '#82CA9D', '#A4DE6C'];
const UNKNOWN_COLOR = '#D2D4D7';

export default function AbsenceReasonsBreakdown({
  reasons,
}: {
  reasons: Array<AbsenceReason>;
}) {
  const enrichedReasons = useMemo(
    () =>
      reasons.map((reason, index) => ({
        ...reason,
        color:
          reason.name === 'Unknown'
            ? UNKNOWN_COLOR
            : CHART_COLORS[index % CHART_COLORS.length],
      })),
    [reasons],
  );

  const chart = useChart({
    data: enrichedReasons,
    series: [{ name: 'count', color: 'red' }],
  });

  return (
    <Card
      title="Most Common Absence Reasons"
      description="Top 5 reasons why players miss training"
    >
      {enrichedReasons.length ? (
        <Chart.Root chart={chart} maxHeight="sm">
          <PieChart responsive>
            <Pie
              data={enrichedReasons}
              labelLine
              isAnimationActive={false}
              dataKey={chart.key('count')}
              label={({ name, value }) => `${name}: ${value}`}
              shape={(props: PieSectorShapeProps) => (
                <Sector {...props} fill={props.payload.color} />
              )}
            />
          </PieChart>
        </Chart.Root>
      ) : (
        <EmptyState icon={<ChartPie />} title="No absence reasons records" />
      )}
    </Card>
  );
}
