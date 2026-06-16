'use client';

import { For, SegmentGroup } from '@chakra-ui/react';

import FilterBar from '@/components/filters/FilterBar';
import TimePicker from '@/components/filters/TimePicker';
import { Field } from '@/components/ui/field';

import {
  ALL,
  GAME_TYPE_SELECTION,
  MATCH_TYPE_SELECTION,
} from '@/utils/constant';
import { Interval } from '@/utils/enum';
import { MatchSearchParamsKeys, useMatchFilters } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { useLocalFilters } from '@/hooks/use-local-filters';

const gameTypes = [ALL, ...GAME_TYPE_SELECTION];
const matchTypes = [ALL, ...MATCH_TYPE_SELECTION];
const DEFAULT_FILTERS = {
  game_type: ALL.value,
  interval: Interval.THIS_YEAR,
  match_type: ALL.value,
};

export default function MatchFilters() {
  const [{ game_type, interval, match_type }, setSearchParams] =
    useMatchFilters();
  const { draft, setField, ...rest } = useLocalFilters(
    { game_type, interval, match_type },
    DEFAULT_FILTERS,
    (values) =>
      setSearchParams(
        {
          interval: values.interval,
          game_type: values.game_type,
          match_type: values.match_type,
          page: 1,
        },
        { shallow: false },
      ),
  );

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  const activeCount = [
    game_type !== DEFAULT_FILTERS.game_type,
    interval !== DEFAULT_FILTERS.interval,
    match_type !== DEFAULT_FILTERS.match_type,
  ].filter(Boolean).length;

  return (
    <FilterBar
      activeCount={activeCount}
      {...rest}
      inlineFilters={(context) =>
        context === 'inline' ? (
          <TimePicker
            value={interval}
            onChange={(value) => handleSearchParams('interval', value)}
          />
        ) : (
          <TimePicker
            value={draft.interval}
            onChange={(value) => setField('interval', value as Interval)}
          />
        )
      }
      advancedFilters={
        <>
          <Field label="Game Type">
            <SegmentGroup.Root
              size="sm"
              value={draft.game_type}
              data-testid="type-filter"
              onValueChange={({ value }) =>
                setField('game_type', value as string)
              }
            >
              <SegmentGroup.Indicator />
              <For each={gameTypes}>
                {({ label, value }) => (
                  <SegmentGroup.Item key={value} value={value}>
                    <SegmentGroup.ItemText _checked={{ fontWeight: 'medium' }}>
                      {label}
                    </SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                )}
              </For>
            </SegmentGroup.Root>
          </Field>
          <Field label="Match Type">
            <SegmentGroup.Root
              size="sm"
              value={draft.match_type}
              data-testid="category-filter"
              onValueChange={({ value }) =>
                setField('match_type', value as string)
              }
            >
              <SegmentGroup.Indicator />
              <For each={matchTypes}>
                {({ label, value }) => (
                  <SegmentGroup.Item key={value} value={value}>
                    <SegmentGroup.ItemText
                      _checked={{
                        fontWeight: 'medium',
                        color: getColor(value),
                      }}
                    >
                      {label}
                    </SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                )}
              </For>
            </SegmentGroup.Root>
          </Field>
        </>
      }
    />
  );
}
