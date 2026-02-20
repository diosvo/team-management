'use client';

import { Chart, useChart } from '@chakra-ui/charts';
import { Card } from '@chakra-ui/react';
import { ChartPie } from 'lucide-react';
import { Pie, PieChart, PieSectorShapeProps, Sector } from 'recharts';

import { EmptyState } from '@/components/ui/empty-state';

import { AbsenceReason } from '@/types/analytics';

export default function AbsenceReasonsBreakdown({
  reasons,
}: {
  reasons: Array<AbsenceReason>;
}) {
  const chart = useChart({
    data: reasons,
    series: [{ name: 'count', color: 'red' }],
  });

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Most Common Absence Reasons</Card.Title>
        <Card.Description>
          Top 5 reasons why players miss training
        </Card.Description>
      </Card.Header>
      <Card.Body>
        {reasons.length ? (
          <Chart.Root maxHeight="xs" chart={chart}>
            <PieChart responsive>
              <Pie
                data={reasons}
                labelLine
                isAnimationActive
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
      </Card.Body>
    </Card.Root>
  );
}
