'use client';

import { useState } from 'react';

import {
  createListCollection,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Portal,
  Select,
  Status,
} from '@chakra-ui/react';
import { Filter, Search } from 'lucide-react';

import Visibility from '@/components/visibility';

import { Asset } from '@/drizzle/schema';
import { usePermissions } from '@/hooks/use-permissions';
import {
  AssetCategorySelection,
  AssetConditionSelection,
} from '@/utils/constant';
import { colorCondition } from '@/utils/helper';

import AddItem from './add-item';
import CategoryTable from './table';

const categories = createListCollection({
  items: [
    {
      label: 'All',
      value: 'all',
    },
    ...AssetCategorySelection,
  ],
});
const conditions = createListCollection({
  items: [
    {
      label: 'All',
      value: 'all',
    },
    ...AssetConditionSelection,
  ],
});

export default function AssetList({ data }: { data: Array<Asset> }) {
  const { isAdmin } = usePermissions();

  const [searchValue, setSearchValue] = useState('');

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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </InputGroup>
        <Select.Root
          collection={categories}
          width="3xs"
          defaultValue={['all']}
          size={{ base: 'sm', md: 'md' }}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <HStack>
                <Filter size={14} />
                <Select.ValueText placeholder="Categories" />
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
          defaultValue={['all']}
          size={{ base: 'sm', md: 'md' }}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <HStack>
                <Status.Root colorPalette={colorCondition('POOR')}>
                  <Status.Indicator />
                </Status.Root>
                <Select.ValueText placeholder="Categories" />
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
          <AddItem />
        </Visibility>
      </HStack>
      <CategoryTable items={data} />
    </>
  );
}
