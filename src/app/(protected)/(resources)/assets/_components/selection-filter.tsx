'use client';

import { useState } from 'react';

import {
  Button,
  createListCollection,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Portal,
  Select,
  Status,
} from '@chakra-ui/react';
import { Filter, Plus, Search } from 'lucide-react';

import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import { getDefaults } from '@/lib/zod';
import {
  ALL,
  AssetCategorySelection,
  AssetConditionSelection,
} from '@/utils/constant';
import { colorCondition } from '@/utils/helper';

import { UpsertAssetSchema } from '@/features/asset/schemas/asset';
import { UpsertAsset } from './upsert-asset';

const categories = createListCollection({
  items: [ALL, ...AssetCategorySelection],
});
const conditions = createListCollection({
  items: [ALL, ...AssetConditionSelection],
});

export default function SelectionFilter() {
  const { isAdmin } = usePermissions();
  const [filters, setFilters] = useState({
    search: '',
    category: ALL.value,
    condition: ALL.value,
  });

  return (
    <>
      <HStack marginBottom={6}>
        <InputGroup
          startElement={<Search size={14} />}
          endElement={<Kbd size="sm">Enter</Kbd>}
        >
          <Input
            size={{ base: 'sm', md: 'md' }}
            placeholder="Search"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </InputGroup>
        <Select.Root
          collection={categories}
          width="3xs"
          defaultValue={[ALL.value]}
          size={{ base: 'sm', md: 'md' }}
          onValueChange={({ value }) =>
            setFilters((prev) => ({ ...prev, category: value[0] }))
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
                  <Select.Item item={category} key={category.value}>
                    {category.label}
                    <Select.ItemIndicator />
                  </Select.Item>
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
            setFilters((prev) => ({ ...prev, condition: value[0] }))
          }
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <HStack>
                <Status.Root colorPalette={colorCondition(filters.condition)}>
                  <Status.Indicator />
                </Status.Root>
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
                      <Status.Root
                        colorPalette={colorCondition(condition.value)}
                      >
                        <Status.Indicator />
                      </Status.Root>
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
                item: getDefaults(UpsertAssetSchema),
              })
            }
          >
            <Plus />
            Add
          </Button>
        </Visibility>
      </HStack>
      <UpsertAsset.Viewport />
    </>
  );
}
