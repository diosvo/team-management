'use client';

import { useMemo, useRef } from 'react';

import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import { useFilters } from '../_helpers/use-filters';
import AddUser from './add-user';
import SearchBar from './search-bar';
import SelectionFilter from './selection-filter';

export default function RosterActions({
  emailExists,
}: {
  emailExists: Array<string>;
}) {
  const isAdmin = usePermissions();
  const { defaultFilters, filters, isPending, updateFilters } = useFilters();

  const dialogContentRef = useRef<HTMLDivElement>(null);
  const isFilterEmpty = useMemo(
    () =>
      filters.query === '' &&
      filters.roles?.length === 0 &&
      filters.state?.length === 0,
    [filters]
  );

  return (
    <VStack align="stretch">
      <HStack justifyContent="space-between">
        <Heading size="2xl">Team Roster</Heading>
        <Button
          variant="plain"
          textDecoration="underline"
          _hover={{ color: 'tomato' }}
          disabled={isFilterEmpty || isPending}
          onClick={() => updateFilters(defaultFilters)}
        >
          Clear all search
        </Button>
      </HStack>

      <HStack marginBlock={2}>
        <SearchBar />
        <SelectionFilter />
        <Visibility isVisible={isAdmin}>
          <Button
            onClick={() =>
              dialog.open('add-user', {
                contentRef: dialogContentRef,
                children: (
                  <AddUser
                    emailExists={emailExists}
                    containerRef={dialogContentRef}
                  />
                ),
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
