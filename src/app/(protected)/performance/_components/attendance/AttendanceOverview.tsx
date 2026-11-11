'use client';

import { useTranslations } from 'next-intl';
import {
  Badge,
  HStack,
  List,
  Separator,
  SimpleGrid,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CalendarCheck } from 'lucide-react';

import { TREND_WINDOW_DAYS } from '@/utils/constants';
import { AttendanceStatus } from '@/utils/enum';
import { colorRank } from '@/utils/helper';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Stat } from '@/components/ui/stat';
import { enumLabel } from '@/i18n/enums';
import type {
  AttendanceOverview as AttendanceOverviewData,
  AttendanceTrend,
} from '@/types/performance';

import { AttendanceTrendChart } from '../LazyCharts';
import TrendBadge from '../TrendBadge';

function TrendLine({ trend }: { trend: AttendanceTrend | null }) {
  const t = useTranslations('performance.attendance');
  const weeks = TREND_WINDOW_DAYS / 7;

  if (!trend) {
    return (
      <Text fontSize="sm" color="GrayText">
        {t('notEnough', { weeks: weeks * 2 })}
      </Text>
    );
  }

  return (
    <HStack justifyContent="space-between">
      <VStack alignItems="start" gap={0}>
        <Text fontSize="sm">{t('lastWeeks', { weeks })}</Text>
        <Text fontSize="xs" color="GrayText">
          {t('trendCompare', {
            recent: trend.recent,
            previous: trend.previous,
          })}
        </Text>
      </VStack>
      <TrendBadge value={trend.delta} />
    </HStack>
  );
}

export default function AttendanceOverview({
  data,
  subject,
}: {
  data: AttendanceOverviewData;
  /** "You" on your own page, otherwise the player's name. */
  subject: string;
}) {
  const t = useTranslations('performance.attendance');
  const te = useTranslations('enums');
  const hasSessions = data.total > 0;
  const diff = Math.round((data.rate - data.team_rate) * 10) / 10;

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
      <Card
        gridColumn={{ lg: 'span 2' }}
        title={t('trendTitle')}
        description={t('trendDescription')}
      >
        {data.monthly.length > 0 ? (
          <AttendanceTrendChart records={data.monthly} subject={subject} />
        ) : (
          <EmptyState
            icon={<CalendarCheck />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        )}
      </Card>

      <Card title={t('breakdownTitle')} description={t('breakdownDescription')}>
        <VStack alignItems="stretch" gap={4}>
          <SimpleGrid columns={3} gap={2}>
            <Stat
              size="sm"
              label={enumLabel(
                te,
                'attendanceStatus',
                AttendanceStatus.ON_TIME,
              )}
              value={data.on_time}
              color="green"
            />
            <Stat
              size="sm"
              label={enumLabel(te, 'attendanceStatus', AttendanceStatus.LATE)}
              value={data.late}
              color="orange"
            />
            <Stat
              size="sm"
              label={enumLabel(te, 'attendanceStatus', AttendanceStatus.ABSENT)}
              value={data.absent}
              color="red"
            />
          </SimpleGrid>

          <Separator />

          <HStack justifyContent="space-between">
            <VStack alignItems="start" gap={0}>
              <Text fontSize="sm">{t('againstTeam')}</Text>
              <Text fontSize="xs" color="GrayText">
                {t('comparison', {
                  subject,
                  rate: data.rate,
                  teamRate: data.team_rate,
                })}
              </Text>
            </VStack>
            {hasSessions ? (
              <Badge
                variant="surface"
                borderRadius="full"
                colorPalette={diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray'}
              >
                {t('pointsDiff', { diff: `${diff > 0 ? '+' : ''}${diff}` })}
              </Badge>
            ) : (
              <Span fontSize="sm" color="GrayText">
                –
              </Span>
            )}
          </HStack>

          <Separator />

          <TrendLine trend={data.trend} />

          {data.reasons.length > 0 && (
            <>
              <Separator />
              <VStack alignItems="stretch" gap={1}>
                <Text fontSize="sm">{t('reasonsTitle')}</Text>
                <List.Root paddingInline={4} fontSize="sm" color="GrayText">
                  {data.reasons.map(({ name, count }) => (
                    <List.Item key={name ?? ''}>
                      {name ?? t('unknownReason')}
                      <Span marginLeft={1} color={colorRank(100 - count * 10)}>
                        ×{count}
                      </Span>
                    </List.Item>
                  ))}
                </List.Root>
              </VStack>
            </>
          )}
        </VStack>
      </Card>
    </SimpleGrid>
  );
}
