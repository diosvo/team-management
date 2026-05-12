'use client';

import { For, SegmentGroup } from '@chakra-ui/react';

import FilterBar from '@/components/filters/FilterBar';
import { Field } from '@/components/ui/field';

import {
  ALL,
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
} from '@/utils/constant';
import { useAssetFilters } from '@/utils/filters';
import { colorCategory, colorCondition } from '@/utils/helper';

import { useLocalFilters } from '@/hooks/use-local-filters';

const categoryItems = [ALL, ...ASSET_CATEGORY_SELECTION];
const conditionItems = [ALL, ...ASSET_CONDITION_SELECTION];

export default function AssetFilters() {
  const [{ category, condition }, setSearchParams] = useAssetFilters();
  const { draft, setField, handleReset, handleApply, handleInteractOutside } =
    useLocalFilters(
      { category, condition },
      { category: ALL.value, condition: ALL.value },
      (values) => setSearchParams({ ...values, page: 1 }),
    );

  const activeCount = [category, condition].filter(
    (value) => value !== ALL.value,
  );

  return (
    <FilterBar
      activeCount={activeCount.length}
      handleReset={handleReset}
      handleApply={handleApply}
      handleInteractOutside={handleInteractOutside}
      advancedFilters={
        <>
          <Field label="Category">
            <SegmentGroup.Root
              size="sm"
              value={draft.category}
              data-testid="category-filter"
              onValueChange={({ value }) =>
                setField('category', value as string)
              }
            >
              <SegmentGroup.Indicator />
              <For each={categoryItems}>
                {({ label, value, description }) => (
                  <SegmentGroup.Item
                    key={value}
                    value={value}
                    title={description}
                  >
                    <SegmentGroup.ItemText
                      _checked={{
                        fontWeight: 'medium',
                        color: colorCategory(value),
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
          <Field label="Condition">
            <SegmentGroup.Root
              size="sm"
              value={draft.condition}
              data-testid="condition-filter"
              onValueChange={({ value }) =>
                setField('condition', value as string)
              }
            >
              <SegmentGroup.Indicator />
              <For each={conditionItems}>
                {({ label, value, description }) => (
                  <SegmentGroup.Item
                    key={value}
                    value={value}
                    title={description}
                  >
                    <SegmentGroup.ItemText
                      _checked={{
                        fontWeight: 'medium',
                        color: colorCondition(value),
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
