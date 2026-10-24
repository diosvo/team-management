import { HStack, Span, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';

import type { PlayerTypeProgression } from '@/types/periodic-testing';
import { formatDate } from '@/utils/datetime';
import { formatResult } from '@/utils/progression';

import {
  BandBadge,
  ChangeText,
  StatusBadge,
} from '../../_components/ProgressBadges';
import LazyProgressionChart from './LazyProgressionChart';

export default function TypeProgressionCard({
  progression,
}: {
  progression: PlayerTypeProgression;
}) {
  const t = useTranslations('periodicTesting.playerProgression');
  const { type, baseline, latest, best, change, count, status, band } =
    progression;

  return (
    <Card
      title={
        <>
          {type.name}
          <Span fontSize="xs" color="GrayText" marginLeft={1}>
            {t('direction', {
              direction: type.higher_is_better ? 'higher' : 'lower',
            })}
          </Span>
        </>
      }
      action={
        <HStack>
          <StatusBadge status={status} />
          <BandBadge band={band} />
        </HStack>
      }
      description={
        <>
          {formatResult(baseline.result, type.unit)} →{' '}
          {formatResult(latest.result, type.unit)} (
          <ChangeText change={change} count={count} />{' '}
          {t('since', { date: formatDate(baseline.date) })})
        </>
      }
    >
      <LazyProgressionChart progression={progression} />
      <Text fontSize="sm" color="GrayText" marginTop={2}>
        {t('best', {
          result: formatResult(best.result, type.unit),
          date: formatDate(best.date),
        })}
        {' · '}
        {t('testCount', { count })}
      </Text>
    </Card>
  );
}
