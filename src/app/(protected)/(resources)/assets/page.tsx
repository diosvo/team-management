import PageTitle from '@/components/page-title';
import { Button, HStack, Input, InputGroup, Kbd } from '@chakra-ui/react';
import { Plus, Search } from 'lucide-react';
import AssetList from './_components/list';
import AssetStats from './_components/stats';

export default function AssetsPage() {
  return (
    <>
      <HStack>
        <PageTitle>Assets</PageTitle>
        <InputGroup
          width="max-content"
          marginLeft="auto"
          startElement={<Search size={14} />}
          endElement={<Kbd size="sm">Enter</Kbd>}
        >
          <Input size={{ base: 'sm', md: 'md' }} placeholder="Search" />
        </InputGroup>
        <Button size={{ base: 'sm', md: 'md' }}>
          <Plus size={14} />
          Add Item
        </Button>
      </HStack>

      <AssetStats />
      <AssetList />
    </>
  );
}
