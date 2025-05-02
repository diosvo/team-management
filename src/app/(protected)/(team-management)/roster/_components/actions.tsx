'use client';

import { useMemo, useRef } from 'react';

import { Button, Heading, HStack, Image, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

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
    () => !Object.values(filters).every(Boolean),
    [filters]
  );

  return (
    <VStack align="stretch">
      <HStack justifyContent="space-between">
        <Heading
          position="relative"
          color="red.500"
          fontStyle="italic"
          size={{ base: 'xl', md: '2xl' }}
        >
          Team Roster
          <Image
            position="absolute"
            left={0}
            src="https://uploads-ssl.webflow.com/5fac11c3554384e2baf6481c/61c4dc7572d22f05ba26fd34_hero-underline.svg"
            loading="lazy"
            alt=""
          />
        </Heading>
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
