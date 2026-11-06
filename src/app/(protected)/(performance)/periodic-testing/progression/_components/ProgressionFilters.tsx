'use client';

import { useMemo } from 'react';

import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import type { TestType } from '@/drizzle/schema';
import { enumLabel, useSelection } from '@/i18n/enums';
import { useProgressionFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import {
  PERFORMANCE_BAND_SELECTION,
  PROGRESS_STATUS_SELECTION,
} from '@/utils/constants';

export default function ProgressionFilters({
  types,
  selected,
}: {
  types: Array<TestType>;
  // The type the server resolved, which may differ from an empty URL param.
  selected: Nullable<string>;
}) {
  const t = useTranslations('periodicTesting.progression');
  const tEnums = useTranslations('enums');
  const statusOptions = useSelection(
    PROGRESS_STATUS_SELECTION,
    'progressStatus',
  );
  const bandOptions = useSelection(
    PERFORMANCE_BAND_SELECTION,
    'performanceBand',
  );
  const filters: Array<FilterDef> = [
    {
      key: 'status',
      label: t('trend'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
    {
      key: 'band',
      label: t('target'),
      control: { type: 'checkbox-group', options: bandOptions },
    },
  ];
  const [values, setSearchParams] = useProgressionFilters();
  const disabled = types.length === 0;

  const typeCollection = useMemo(
    () =>
      createListCollection({
        items: types.map(({ type_id, name, unit }) => ({
          label: `${name} (${enumLabel(tEnums, 'testTypeUnit', unit)})`,
          value: type_id,
        })),
      }),
    [types, tEnums],
  );

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useProgressionFilters.defaults}
      disabled={disabled}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
      actions={
        <Select.Root
          collection={typeCollection}
          minWidth={44}
          flexShrink={0}
          width="max-content"
          disabled={disabled}
          size={{ base: 'sm', md: 'md' }}
          value={selected ? [selected] : []}
          onValueChange={({ value }) =>
            setSearchParams({ type: value[0], page: 1 }, { shallow: false })
          }
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <HStack>
                <Activity size={16} />
                <Select.ValueText placeholder={t('testType')} />
              </HStack>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {typeCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      }
    />
  );
}
