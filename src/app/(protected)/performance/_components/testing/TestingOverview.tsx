'use client';

import { useTranslations } from 'next-intl';
import {
  Badge,
  chakra,
  HStack,
  Progress,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FlaskConical } from 'lucide-react';

import { formatDate } from '@/utils/datetime';

import { usePerformanceFilters } from '@/lib/nuqs';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { enumLabel } from '@/i18n/enums';
import type {
  TestingOverview as TestingOverviewData,
  TestTypeProgress,
} from '@/types/performance';

import { TestProgressChart, TestRadarChart } from '../LazyCharts';
import TrendBadge from '../TrendBadge';

/** A radar needs at least three axes to read as a shape. */
const RADAR_MIN_TYPES = 3;

/**
 * "Latest results" shows four rows, then scrolls: 4 rows (5.75rem + 2px
 * border each), 3 gaps (0.5rem) and the list's own padding (2 × 0.25rem).
 */
const RESULTS_MAX_HEIGHT = 'calc(4 * (5.75rem + 2px) + 3 * 0.5rem + 0.5rem)';

function ImprovementBadge({ value }: { value: number | null }) {
  const t = useTranslations('performance.testing');

  if (value == null) {
    return (
      <Badge variant="surface" borderRadius="full" colorPalette="gray">
        {t('firstResult')}
      </Badge>
    );
  }

  return <TrendBadge value={value} />;
}

function ResultRow({
  type,
  active,
  onSelect,
}: {
  type: TestTypeProgress;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('performance.testing');
  const te = useTranslations('enums');
  const { latest } = type;

  return (
    <chakra.button
      type="button"
      width="full"
      textAlign="left"
      padding={3}
      borderWidth={1}
      rounded="md"
      borderColor={active ? 'blue.500' : 'border'}
      backgroundColor={active ? 'blue.50' : undefined}
      _hover={{ backgroundColor: active ? 'blue.50' : 'gray.50' }}
      aria-pressed={active}
      onClick={onSelect}
    >
      <VStack alignItems="stretch" gap={1}>
        <HStack justifyContent="space-between" alignItems="start" gap={3}>
          <VStack alignItems="start" gap={0} minWidth={0}>
            <Text fontSize="sm" color="GrayText" truncate maxWidth="full">
              {type.name}
            </Text>
            <HStack alignItems="baseline" gap={1}>
              <Text fontSize="xl" fontWeight="bold">
                {latest.result}
              </Text>
              <Text fontSize="xs" color="GrayText">
                {enumLabel(te, 'testTypeUnit', type.unit)}
              </Text>
            </HStack>
          </VStack>
          <ImprovementBadge value={latest.improvement_pct} />
        </HStack>
        <Text fontSize="xs" color="GrayText">
          {latest.team_avg != null
            ? t('teamAvg', { value: latest.team_avg })
            : t('noTeammates')}
          {latest.percentile != null &&
            ` · ${t('betterThan', { percentile: latest.percentile })}`}
        </Text>
      </VStack>
    </chakra.button>
  );
}

export default function TestingOverview({
  data,
  subject,
}: {
  data: TestingOverviewData;
  /** "You" on your own page, otherwise the player's name. */
  subject: string;
}) {
  const t = useTranslations('performance.testing');
  const te = useTranslations('enums');
  const [{ test }, setSearchParams] = usePerformanceFilters();

  const [firstType] = data.types;
  if (!firstType) {
    return (
      <Card title={t('title')}>
        <EmptyState
          icon={<FlaskConical />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      </Card>
    );
  }

  const selected = data.types.find(({ name }) => name === test) ?? firstType;
  const radarPoints = data.types.flatMap(({ name, latest }) =>
    latest.percentile == null ? [] : [{ name, percentile: latest.percentile }],
  );

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
      <Card
        title={t('latestTitle')}
        description={
          data.last_tested
            ? t('latestDescription', { date: formatDate(data.last_tested) })
            : undefined
        }
      >
        <VStack
          alignItems="stretch"
          maxHeight={RESULTS_MAX_HEIGHT}
          overflowY="auto"
          overscrollBehavior="contain"
          // Room for the focus ring so the scroll box doesn't clip it.
          padding={1}
        >
          {data.types.map((type) => (
            <ResultRow
              key={type.type_id}
              type={type}
              active={type.type_id === selected.type_id}
              onSelect={() => setSearchParams({ test: type.name })}
            />
          ))}
        </VStack>
      </Card>

      <Card
        gridColumn={{ lg: 'span 2' }}
        title={t('progressTitle')}
        description={t('progressDescription', {
          name: selected.name,
          unit: enumLabel(te, 'testTypeUnit', selected.unit),
          direction: selected.lower_is_better ? 'lower' : 'higher',
        })}
      >
        <TestProgressChart
          key={selected.type_id}
          type={selected}
          subject={subject}
        />
      </Card>

      <Card
        gridColumn={{ lg: 'span 3' }}
        title={t('standingTitle')}
        description={t('standingDescription')}
      >
        {radarPoints.length >= RADAR_MIN_TYPES ? (
          <TestRadarChart points={radarPoints} />
        ) : radarPoints.length > 0 ? (
          <VStack alignItems="stretch" gap={3}>
            {radarPoints.map(({ name, percentile }) => (
              <Progress.Root key={name} value={percentile} size="sm">
                <HStack justifyContent="space-between">
                  <Progress.Label fontSize="sm">{name}</Progress.Label>
                  <Progress.ValueText fontSize="sm">
                    {percentile}%
                  </Progress.ValueText>
                </HStack>
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            ))}
          </VStack>
        ) : (
          <EmptyState
            size="sm"
            icon={<FlaskConical />}
            title={t('noComparisonTitle')}
            description={t('noComparisonDescription')}
          />
        )}
      </Card>
    </SimpleGrid>
  );
}
