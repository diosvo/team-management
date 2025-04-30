'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import { SelectableRole, SelectableState } from '@/utils/type';
import AddUser from './add-user';
import SearchBar from './search-bar';
import SelectionFilter from './selection-filter';

export default function RosterActions({
  emailExists,
}: {
  emailExists: Array<string>;
}) {
  const isAdmin = usePermissions();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [openPopover, setOpenPopover] = useState<boolean>(false);

  // Access the parameters of the current URL
  const searchParams = useSearchParams();
  // Read the current URL's pathname
  const pathname = usePathname();
  // Enable navigation between routes within client components programmatically
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSelection = (
    state: Array<SelectableState>,
    roles: Array<SelectableRole>
  ) => {
    const params = new URLSearchParams(searchParams);
    if (state.length > 0) {
      params.set('state', state.join(','));
    } else {
      params.delete('state');
    }
    if (roles.length > 0) {
      params.set('roles', roles.join(','));
    } else {
      params.delete('roles');
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('query');
    params.delete('state');
    params.delete('roles');
    startTransition(() => replace(`${pathname}?${params.toString()}`));
  };

  return (
    <VStack align="stretch">
      <HStack alignItems="center">
        <Heading as="h1" size="xl" marginRight="auto">
          Team Roster
        </Heading>
        <Button
          variant="plain"
          textDecoration="underline"
          _hover={{ color: 'tomato' }}
          disabled={!searchParams.toString()}
          onClick={handleClearAll}
        >
          Clear all search
        </Button>
      </HStack>

      <HStack marginBlock={2}>
        <SearchBar isPending={isPending} onSearch={handleSearch} />

        <SelectionFilter
          open={openPopover}
          onOpenChange={setOpenPopover}
          onFilter={handleSelection}
        />

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
