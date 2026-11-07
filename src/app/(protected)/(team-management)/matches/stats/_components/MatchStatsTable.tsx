import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { chakra, Table, Text } from '@chakra-ui/react';
import { ClipboardList } from 'lucide-react';

import { MATCH_STAT_FIELDS, type MatchStatField } from '@/utils/constants';

import StatAbbr from '@/components/StatAbbr';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { Tooltip } from '@/components/ui/tooltip';

export type GridPlayer = {
  id: string;
  name: string;
  jersey_number: Nullable<number>;
};

/** Keep draft values as strings until save to avoid cleared inputs snapping to 0. */
export type StatDraft = Record<MatchStatField, string>;

const stickyColumn = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: 'white',
} as const;

const removalStyle = {
  textDecoration: 'line-through',
  textDecorationColor: 'red.500',
};

type StatCellProps = {
  playerId: string;
  field: MatchStatField;
  label: string;
  value: string;
  max: number;
  disabled: boolean;
  onChange: (playerId: string, field: MatchStatField, value: string) => void;
};

// Memoized so typing in one cell doesn't re-render the whole grid.
const StatCell = memo(function StatCell({
  playerId,
  field,
  label,
  value,
  max,
  disabled,
  onChange,
}: StatCellProps) {
  return (
    <Table.Cell padding={1}>
      <NumberInputRoot
        size="sm"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onValueChange={({ value }) => onChange(playerId, field, value)}
      >
        <NumberInputField aria-label={label} textAlign="center" />
      </NumberInputRoot>
    </Table.Cell>
  );
});

type MatchStatsTableProps = {
  players: Array<GridPlayer>;
  drafts: Record<string, StatDraft>;
  disabled: boolean;
  onChange: StatCellProps['onChange'];
  onRemove: (playerId: string) => void;
};

export default function MatchStatsTable({
  players,
  drafts,
  disabled,
  onChange,
  onRemove,
}: MatchStatsTableProps) {
  const t = useTranslations('matches.boxScore');
  const hasData = players.length > 0;

  return (
    <Table.ScrollArea>
      <Table.Root size="sm" showColumnBorder>
        {hasData && (
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader {...stickyColumn}>
                {t('player')}
              </Table.ColumnHeader>
              {MATCH_STAT_FIELDS.map(({ key }) => (
                <Table.ColumnHeader key={key} textAlign="center" minWidth={20}>
                  <StatAbbr
                    short={t(`stats.${key}.short`)}
                    label={t(`stats.${key}.label`)}
                  />
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
        )}
        <Table.Body>
          {hasData ? (
            players.map(({ id, name, jersey_number }) => (
              <Table.Row key={id}>
                <Table.Cell {...stickyColumn}>
                  <Tooltip
                    showArrow
                    content={t('remove', { name })}
                    positioning={{ placement: 'top-start' }}
                  >
                    <chakra.button
                      type="button"
                      textAlign="left"
                      rounded="sm"
                      cursor={disabled ? 'not-allowed' : 'pointer'}
                      disabled={disabled}
                      aria-label={t('remove', { name })}
                      _hover={disabled ? undefined : removalStyle}
                      _focusVisible={{
                        ...removalStyle,
                        outline: '2px solid',
                        outlineColor: 'colorPalette.focusRing',
                        outlineOffset: '2px',
                      }}
                      onClick={() => onRemove(id)}
                    >
                      {jersey_number != null && (
                        <Text as="span" color="GrayText" marginRight={1}>
                          {jersey_number} -
                        </Text>
                      )}
                      {name}
                    </chakra.button>
                  </Tooltip>
                </Table.Cell>
                {MATCH_STAT_FIELDS.map(({ key, max }) => (
                  <StatCell
                    key={key}
                    playerId={id}
                    field={key}
                    label={t('cellLabel', {
                      stat: t(`stats.${key}.label`),
                      name,
                    })}
                    value={drafts[id]?.[key] ?? '0'}
                    max={max}
                    disabled={disabled}
                    onChange={onChange}
                  />
                ))}
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan={MATCH_STAT_FIELDS.length + 1}>
                <EmptyState
                  icon={<ClipboardList />}
                  title={t('emptyTitle')}
                  description={t('emptyDescription')}
                />
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
