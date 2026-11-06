import { Table } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';

import type { PlayerTypeProgression } from '@/types/periodic-testing';
import { formatDate } from '@/utils/datetime';
import {
  formatChange,
  formatResult,
  relativeChange,
} from '@/utils/progression';

/** Every result across test types, newest first, against the team average. */
export default function TestHistory({
  types,
}: {
  types: Array<PlayerTypeProgression>;
}) {
  const t = useTranslations('periodicTesting.playerProgression.history');
  const rows = types
    .flatMap(({ type, history }) =>
      history.map((point) => ({ type, ...point })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card title={t('title')}>
      <Table.ScrollArea>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t('date')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('test')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">
                {t('result')}
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">
                {t('teamAverage')}
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">
                {t('vsAverage')}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map(({ type, date, result, team_average }) => {
              const gap = relativeChange(
                team_average,
                result,
                type.higher_is_better,
              );
              return (
                <Table.Row key={`${type.type_id}|${date}`}>
                  <Table.Cell>{formatDate(date)}</Table.Cell>
                  <Table.Cell>{type.name}</Table.Cell>
                  <Table.Cell textAlign="right">
                    {formatResult(result, type.unit)}
                  </Table.Cell>
                  <Table.Cell textAlign="right" color="GrayText">
                    {formatResult(team_average, type.unit)}
                  </Table.Cell>
                  <Table.Cell
                    textAlign="right"
                    color={
                      gap > 0 ? 'green.600' : gap < 0 ? 'red.600' : 'GrayText'
                    }
                  >
                    {formatChange(gap)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Card>
  );
}
