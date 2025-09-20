'use client';

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  Select,
} from '@chakra-ui/react';
import { Filter, Plus } from 'lucide-react';

import SearchInput from '@/components/ui/search-input';
import { Status } from '@/components/ui/status';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import {
  ALL,
  AssetCategorySelection,
  AssetConditionSelection,
} from '@/utils/constant';
import { colorCondition } from '@/utils/helper';

import { UpsertAsset } from './UpsertAsset';

const categories = createListCollection({
  items: [ALL, ...AssetCategorySelection],
});
const conditions = createListCollection({
  items: [ALL, ...AssetConditionSelection],
});

type AssetFiltersProps = {
  query: string;
  category: string;
  condition: string;
};

export default function AssetFilters({
  search,
  setSearch,
}: Search<AssetFiltersProps>) {
  const { isAdmin } = usePermissions();

  return (
    <HStack marginBottom={6}>
      <SearchInput
        value={search.query}
        onValueChange={(value) =>
          setSearch((prev) => ({ ...prev, query: value }))
        }
        onClear={() => {
          setSearch((prev) => ({ ...prev, query: '' }));
        }}
      />
      <Select.Root
        collection={categories}
        width="2xs"
        defaultValue={[ALL.value]}
        size={{ base: 'sm', md: 'md' }}
        onValueChange={({ value }) =>
          setSearch((prev) => ({ ...prev, category: value[0] }))
        }
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Filter size={14} />
              <Select.ValueText placeholder="Category" />
            </HStack>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {categories.items.map((category) => (
                <Tooltip
                  key={category.value}
                  content={category.description || 'All'}
                >
                  <Select.Item item={category}>
                    {category.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                </Tooltip>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Select.Root
        collection={conditions}
        width="3xs"
        defaultValue={[ALL.value]}
        size={{ base: 'sm', md: 'md' }}
        onValueChange={({ value }) =>
          setSearch((prev) => ({ ...prev, condition: value[0] }))
        }
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Status colorPalette={colorCondition(search.condition)} />
              <Select.ValueText placeholder="Condition" />
            </HStack>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {conditions.items.map((condition) => (
                <Select.Item item={condition} key={condition.value}>
                  <HStack>
                    <Status colorPalette={colorCondition(condition.value)} />
                    {condition.label}
                    <Select.ItemIndicator />
                  </HStack>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Visibility isVisible={isAdmin}>
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertAsset.open('add-asset', {
              action: 'Add',
              item: {
                asset_id: '',
              },
            })
          }
        >
          <Plus />
          Add
        </Button>
      </Visibility>
    </HStack>
  );
}
