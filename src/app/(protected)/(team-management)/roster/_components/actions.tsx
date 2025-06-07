'use client';

import { useMemo } from 'react';

import { Button, HStack, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import { useFilters } from '../_helpers/use-filters';
import AddUser from './add-user';
import SearchBar from './search-bar';
import SelectionFilter from './selection-filter';

export default function RosterActions() {
  const { isAdmin } = usePermissions();
  const { filters, isPending, updateFilters } = useFilters();

  const isFilterEmpty = useMemo(
    () => Object.values(filters).every((value) => value.length === 0),
    [filters]
  );

  return (
    <VStack align="stretch">
      <HStack justifyContent="space-between">
        <PageTitle>Team Roster</PageTitle>
        <Button
          variant="plain"
          size={{ base: 'xs', md: 'md' }}
          textDecoration="underline"
          _hover={{ color: 'tomato' }}
          disabled={isFilterEmpty || isPending}
          onClick={() =>
            updateFilters({
              query: '',
              role: [],
              state: [],
            })
          }
        >
          Clear all search
        </Button>
      </HStack>

      <HStack marginBlock={2}>
        <SearchBar />
        <SelectionFilter />
        <Visibility isVisible={isAdmin}>
          <AddUser />
        </Visibility>
      </HStack>
    </VStack>
  );
}
