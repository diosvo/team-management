'use client';

import { useMemo, useRef } from 'react';

import { Button, HStack, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import { useFilters } from '../_helpers/use-filters';
import AddUser from './add-user';
import SearchBar from './search-bar';
import SelectionFilter from './selection-filter';

export default function RosterActions() {
  const isAdmin = usePermissions();
  const { filters, isPending, updateFilters } = useFilters();

  const dialogContentRef = useRef<HTMLDivElement>(null);
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
              roles: [],
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
          <Button
            size={{ base: 'sm', md: 'md' }}
            onClick={() =>
              dialog.open('add-user', {
                contentRef: dialogContentRef,
                children: <AddUser containerRef={dialogContentRef} />,
              })
            }
          >
            <UserRoundPlus />
            Add
          </Button>
        </Visibility>
      </HStack>
    </VStack>
  );
}
