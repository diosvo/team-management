'use client';

import { Chart, useChart } from '@chakra-ui/charts';
import { Box, Card, Span, Text } from '@chakra-ui/react';
import { ChartLine } from 'lucide-react';
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

import { EmptyState } from '@/components/ui/empty-state';

import { AttendanceHistoryRecord } from '@/types/analytics';

const TARGET_RATE = 80 as const;

function CustomTooltip(props: Partial<TooltipContentProps<string, string>>) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0].payload as AttendanceHistoryRecord;

  return (
    <Box backgroundColor="white" padding={2} borderRadius="sm" boxShadow="sm">
      <Text
        color={Number(entry.present_rate) >= TARGET_RATE ? 'green' : 'red'}
        marginBottom={2}
      >
        {entry.present_rate}%
      </Text>
      <Text>
        {entry.attended}/{entry.total} attended
      </Text>
    </Box>
  );
}

export default function AttendanceTrend({
  records,
}: {
  records: Array<AttendanceHistoryRecord>;
}) {
  const chart = useChart({
    data: [...records].reverse(),
    series: [{ name: 'present_rate', color: 'green' }],
  });

  const avgRate =
    records.reduce((sum, record) => sum + record.present_rate, 0) /
    records.length;

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Attendance Rate Trend</Card.Title>
        <Card.Description>
          Overall team attendance percentage
          {avgRate && (
            <>
              :&nbsp;
              <Span color={avgRate >= TARGET_RATE ? 'green.600' : 'red.600'}>
                {avgRate.toFixed(1)}%
              </Span>
            </>
          )}
        </Card.Description>
      </Card.Header>
      <Card.Body>
        {records.length === 0 ? (
          <EmptyState icon={<ChartLine />} title="No attendance records" />
        ) : (
          <Chart.Root maxHeight="xs" chart={chart}>
            <LineChart data={chart.data}>
              <CartesianGrid stroke={chart.color('border')} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey={chart.key('short_date')}
                stroke={chart.color('border')}
              />
              <YAxis
                stroke={chart.color('border')}
                domain={[0, 100]}
                label={{
                  value: 'Attendance %',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip animationDuration={100} content={<CustomTooltip />} />
              <ReferenceLine
                y={TARGET_RATE}
                stroke="orange"
                strokeDasharray="5 5"
                label={{
                  value: `Target (${TARGET_RATE}%)`,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey={chart.key('present_rate')}
                stroke={chart.color('green')}
                strokeWidth={1.5}
              />
            </LineChart>
          </Chart.Root>
        )}
      </Card.Body>
    </Card.Root>
  );
}
