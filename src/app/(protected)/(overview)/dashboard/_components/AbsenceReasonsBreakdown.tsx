'use client';

import { useMemo } from 'react';

import { Chart, useChart } from '@chakra-ui/charts';
import { ChartPie } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Pie, PieChart, type PieSectorShapeProps, Sector } from 'recharts';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import type { AbsenceReason } from '@/types/analytics';

const CHART_COLORS = ['#8884D8', '#83A6ED', '#8DD1E1', '#82CA9D', '#A4DE6C'];
const UNKNOWN_COLOR = '#D2D4D7';

/** Pie slice label: "name: value", with "Unknown" localized. */
export function formatSliceLabel(
  name: string,
  value: number,
  unknownLabel: string,
): string {
  return `${name === 'Unknown' ? unknownLabel : name}: ${value}`;
}

/** Pie slice shape, colored from the enriched reason's own `color`. */
export function ReasonSector(props: PieSectorShapeProps) {
  return <Sector {...props} fill={props.payload.color} />;
}

export default function AbsenceReasonsBreakdown({
  reasons,
}: {
  reasons: Array<AbsenceReason>;
}) {
  const t = useTranslations('dashboard.absenceReasons');
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
    <Card title={t('title')} description={t('description')}>
      {enrichedReasons.length ? (
        <Chart.Root chart={chart} maxHeight="sm">
          <PieChart responsive>
            <Pie
              data={enrichedReasons}
              labelLine
              isAnimationActive={false}
              dataKey={chart.key('count')}
              label={({ name, value }) =>
                formatSliceLabel(name, value, t('unknown'))
              }
              shape={ReasonSector}
            />
          </PieChart>
        </Chart.Root>
      ) : (
        <EmptyState icon={<ChartPie />} title={t('empty')} />
      )}
    </Card>
  );
}
