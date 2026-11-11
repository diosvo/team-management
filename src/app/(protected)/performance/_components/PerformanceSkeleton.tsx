import { useTranslations } from 'next-intl';
import {
  Badge,
  Button,
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import {
  MATCH_AVERAGE_FIELDS,
  MATCH_STAT_FIELDS,
  type PerformanceTab,
} from '@/utils/constants';
import { AttendanceStatus, Interval } from '@/utils/enum';

import { TableSkeleton } from '@/components/PageSkeleton';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import { Stat, StatGroup } from '@/components/ui/stat';
import { enumLabel } from '@/i18n/enums';

/* Loading placeholders for the performance page. They mirror the layout and keep static text visible so the page doesn't jump while data loads. */

/** Columns shared by the stat row and its skeleton. */
export const PERFORMANCE_STAT_COLUMNS = { base: 2, md: 4 } as const;

/** Same box as a `Chart.Root` with `maxHeight="sm"`. */
export function ChartSkeleton() {
  return <Skeleton width="full" aspectRatio="landscape" maxHeight="sm" />;
}

/**
 * Header placeholder. The title is known before any data (it only depends on
 * whose page this is), so it renders for real; the player line and the date
 * picker wait on the database.
 */
export function HeaderSkeleton({ title }: { title?: string }) {
  const t = useTranslations('performance');
  const te = useTranslations('enums');

  return (
    <HStack
      justifyContent="space-between"
      alignItems="start"
      flexWrap="wrap"
      gap={{ base: 3, lg: 4 }}
    >
      <VStack alignItems="start" gap={1}>
        {title ? (
          <PageTitle title={title} />
        ) : (
          <Skeleton>
            <PageTitle title={t('page.ownTitle')} />
          </Skeleton>
        )}
        <HStack flexWrap="wrap">
          <Skeleton>
            <Text fontSize="sm">{t('header.playerName')}</Text>
          </Skeleton>
          <Skeleton>
            <Badge borderRadius="full">#00</Badge>
          </Skeleton>
        </HStack>
      </VStack>
      <Skeleton>
        <Button variant="outline">
          <CalendarSearch />
          {enumLabel(te, 'interval', Interval.THIS_YEAR)}
        </Button>
      </Skeleton>
    </HStack>
  );
}

/** The four stat cards, each with its help-text line. */
export function StatsSkeleton() {
  const t = useTranslations('performance.skeleton');

  return (
    <StatGroup columns={PERFORMANCE_STAT_COLUMNS}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index}>
          <Stat label={t('statLabel')} value={0} helpText={t('helpText')} />
        </Skeleton>
      ))}
    </StatGroup>
  );
}

/** A card whose title is real and whose body is a placeholder. */
function CardSkeleton({
  title,
  description,
  children,
  ...rest
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Card>) {
  const t = useTranslations('performance.skeleton');

  return (
    <Card
      title={title}
      description={
        description ?? (
          <Skeleton asChild>
            <span>{t('description')}</span>
          </Skeleton>
        )
      }
      {...rest}
    >
      {children}
    </Card>
  );
}

export function AttendanceSkeleton() {
  const t = useTranslations('performance.attendance');
  const te = useTranslations('enums');

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
      <CardSkeleton
        gridColumn={{ lg: 'span 2' }}
        title={t('trendTitle')}
        description={t('trendDescription')}
      >
        <ChartSkeleton />
      </CardSkeleton>
      <CardSkeleton
        title={t('breakdownTitle')}
        description={t('breakdownDescription')}
      >
        <VStack alignItems="stretch" gap={4}>
          <SimpleGrid columns={3} gap={2}>
            {[
              AttendanceStatus.ON_TIME,
              AttendanceStatus.LATE,
              AttendanceStatus.ABSENT,
            ].map((status) => (
              <Skeleton key={status}>
                <Stat
                  size="sm"
                  label={enumLabel(te, 'attendanceStatus', status)}
                  value={0}
                />
              </Skeleton>
            ))}
          </SimpleGrid>
          <SkeletonText noOfLines={6} gap={4} />
        </VStack>
      </CardSkeleton>
    </SimpleGrid>
  );
}

export function TestingSkeleton() {
  const t = useTranslations('performance.testing');

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
      <CardSkeleton title={t('latestTitle')}>
        <VStack alignItems="stretch" gap={2}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={20} />
          ))}
        </VStack>
      </CardSkeleton>
      <CardSkeleton gridColumn={{ lg: 'span 2' }} title={t('progressTitle')}>
        <ChartSkeleton />
      </CardSkeleton>
      <CardSkeleton
        gridColumn={{ lg: 'span 3' }}
        title={t('standingTitle')}
        description={t('standingDescription')}
      >
        <ChartSkeleton />
      </CardSkeleton>
    </SimpleGrid>
  );
}

export function ActivitySkeleton() {
  const t = useTranslations('performance.activity');

  return (
    <CardSkeleton
      title={t('title')}
      description={t('description')}
      action={<Skeleton height={8} width={72} />}
    >
      {/* Date, type, details, outcome. */}
      <TableSkeleton columns={4} rows={8} />
    </CardSkeleton>
  );
}

export function MatchesSkeleton() {
  const t = useTranslations('performance');

  return (
    <VStack alignItems="stretch" gap={6}>
      <CardSkeleton
        title={t('matches.chartTitle')}
        description={t('matches.chartDescription')}
      >
        <ChartSkeleton />
        <SimpleGrid
          columns={{ base: 2, md: 4, lg: MATCH_AVERAGE_FIELDS.length }}
          gap={{ base: 2, lg: 3 }}
          marginTop={4}
        >
          {MATCH_AVERAGE_FIELDS.map(({ key }) => (
            <Skeleton key={key}>
              <Stat size="sm" label={t('skeleton.average')} value={0} />
            </Skeleton>
          ))}
        </SimpleGrid>
      </CardSkeleton>
      <CardSkeleton
        title={t('matches.boxScoresTitle')}
        description={t('matches.boxScoresDescription')}
      >
        {/* Date, opponent and score, then one column per stat. */}
        <TableSkeleton columns={3 + MATCH_STAT_FIELDS.length} />
      </CardSkeleton>
    </VStack>
  );
}

export const SECTION_SKELETONS: Record<PerformanceTab, () => React.ReactNode> =
  {
    attendance: AttendanceSkeleton,
    testing: TestingSkeleton,
    activity: ActivitySkeleton,
    matches: MatchesSkeleton,
  };
