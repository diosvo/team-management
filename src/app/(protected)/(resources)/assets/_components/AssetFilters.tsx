'use client';

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  Select,
  Span,
  Stack,
} from '@chakra-ui/react';
import { Filter, Plus } from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import { Status } from '@/components/ui/status';
import Visibility from '@/components/Visibility';

import { usePermissions } from '@/hooks/use-permissions';
import {
  ALL,
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
} from '@/utils/constant';
import { colorCondition } from '@/utils/helper';

import { useAssetFilters } from '../search-params';
import { UpsertAsset } from './UpsertAsset';

const categories = createListCollection({
  items: [ALL, ...ASSET_CATEGORY_SELECTION],
});
const conditions = createListCollection({
  items: [ALL, ...ASSET_CONDITION_SELECTION],
});

export default function AssetFilters() {
  const { isAdmin } = usePermissions();
  const [{ category, condition }, setSearchParams] = useAssetFilters();

  return (
    <HStack marginBottom={6}>
      <SearchInput />
      <Select.Root
        width="xs"
        size={{ base: 'sm', md: 'md' }}
        collection={categories}
        value={[category]}
        onValueChange={({ value }) =>
          setSearchParams({ category: value[0], page: 1 })
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
                <Select.Item key={category.value} item={category}>
                  <Stack gap={0}>
                    <Select.ItemText>{category.label}</Select.ItemText>
                    <Span color="fg.muted" textStyle="xs">
                      {category.description}
                    </Span>
                  </Stack>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Select.Root
        width="3xs"
        size={{ base: 'sm', md: 'md' }}
        collection={conditions}
        value={[condition]}
        onValueChange={({ value }) =>
          setSearchParams({ condition: value[0], page: 1 })
        }
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Status colorPalette={colorCondition(condition)} />
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
