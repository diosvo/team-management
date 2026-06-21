'use client';

import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';

import FilterBar from '@/components/filters/FilterBar';
import TimePicker from '@/components/filters/TimePicker';
import { Field } from '@/components/ui/field';
import { Status } from '@/components/ui/status';

import { ALL, SESSION_STATUS_SELECTION } from '@/utils/constant';
import { Interval } from '@/utils/enum';
import { TrainingSearchParamsKeys, useTrainingFilters } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { useLocalFilters } from '@/hooks/use-local-filters';

const statuses = createListCollection({
  items: [ALL, ...SESSION_STATUS_SELECTION],
});
const DEFAULT_FILTERS = {
  interval: Interval.THIS_MONTH,
  status: ALL.value,
};

export default function SessionFilters() {
  const [{ interval, status }, setSearchParams] = useTrainingFilters();
  const { draft, setField, ...rest } = useLocalFilters(
    { interval, status },
    DEFAULT_FILTERS,
    (values) =>
      setSearchParams(
        {
          interval: values.interval,
          status: values.status,
          page: 1,
        },
        { shallow: false },
      ),
  );

  const handleSearchParams = (key: TrainingSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  const activeCount = [
    interval !== DEFAULT_FILTERS.interval,
    status !== DEFAULT_FILTERS.status,
  ].filter(Boolean).length;

  return (
    <FilterBar
      activeCount={activeCount}
      {...rest}
      inlineFilters={(context) =>
        context === 'inline' ? (
          <TimePicker
            value={interval}
            onChange={(value) => {
              // Keep the draft in sync so a later Apply doesn't revert
              // this inline interval change to a stale value.
              setField('interval', value as Interval);
              handleSearchParams('interval', value);
            }}
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
          <Field label="Status">
            <Select.Root
              size="sm"
              minWidth="fit-content"
              collection={statuses}
              value={[draft.status]}
              onValueChange={({ value }) => setField('status', value[0])}
            >
              <Select.Trigger>
                <HStack>
                  <Status colorPalette={getColor(draft.status)} />
                  <Select.ValueText placeholder="Status" />
                </HStack>
              </Select.Trigger>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {statuses.items.map((status) => (
                      <Select.Item item={status} key={status.value}>
                        <HStack>
                          <Status colorPalette={getColor(status.value)} />
                          {status.label}
                          <Select.ItemIndicator />
                        </HStack>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Field>
        </>
      }
    />
  );
}
