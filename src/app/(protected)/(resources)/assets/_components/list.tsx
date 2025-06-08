import { HStack, Input, InputGroup, Kbd, Tabs } from '@chakra-ui/react';

import { SELECTABLE_ASSET_CATEGORIES } from '@/utils/constant';
import { AssetCategory } from '@/utils/enum';

import { Asset } from '@/drizzle/schema';
import { Search } from 'lucide-react';
import AddItem from './add-item';
import CategoryTable from './table';

export default function AssetList({
  data,
}: {
  data: Record<AssetCategory, Array<Asset>>;
}) {
  return (
    <Tabs.Root variant="plain" size="sm" defaultValue={AssetCategory.EQUIPMENT}>
      <HStack>
        <Tabs.List backgroundColor="bg.muted" borderRadius="lg" padding={1}>
          <Tabs.Trigger value={AssetCategory.EQUIPMENT}>Equipment</Tabs.Trigger>
          <Tabs.Trigger value={AssetCategory.TRANING}>Training</Tabs.Trigger>
          <Tabs.Trigger value={AssetCategory.OTHERS}>Others</Tabs.Trigger>
          <Tabs.Indicator borderRadius="md" />
        </Tabs.List>
        <InputGroup
          width="max-content"
          marginLeft="auto"
          startElement={<Search size={14} />}
          endElement={<Kbd size="sm">Enter</Kbd>}
        >
          <Input size={{ base: 'sm', md: 'md' }} placeholder="Search" />
        </InputGroup>
        <AddItem />
      </HStack>
      {SELECTABLE_ASSET_CATEGORIES.map((category) => (
        <Tabs.Content key={category} value={category}>
          <CategoryTable items={data[category]} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
