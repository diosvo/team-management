'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';
import { UpsertAsset } from './UpsertAsset';

export default function AssetHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Assets" />
      <Authorized resource="assets" action="create">
        <Button
          size={{ base: 'xs', sm: 'sm', md: 'md' }}
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
      </Authorized>
    </HStack>
  );
}
