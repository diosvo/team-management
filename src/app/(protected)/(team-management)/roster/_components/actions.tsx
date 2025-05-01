'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState, useTransition } from 'react';

import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

import SearchBar from '@/components/search-bar';
import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import { SelectableRole, SelectableState } from '@/utils/type';

import AddUser from './add-user';
import SelectionFilter from './selection-filter';

const createQueryString = (
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
) => {
  const params = new URLSearchParams(searchParams.toString());

  console.log('createQueryString', updates);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null) params.delete(key);
    else params.set(key, value);
  });

  return params.toString();
};

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
  const { replace, push } = useRouter();

  const handleSearch = useCallback(
    (term: string) => {
      const queryString = createQueryString(searchParams, {
        query: term || null,
      });

      startTransition(() => {
        push('?' + queryString);
      });
    },
    [searchParams]
  );

  const handleSelection = useCallback(
    (state: Array<SelectableState>, roles: Array<SelectableRole>) => {
      const queryString = createQueryString(searchParams, {
        state: state.length > 0 ? state.join(',') : null,
        roles: roles.length > 0 ? roles.join(',') : null,
      });

      startTransition(() => {
        push('?' + queryString);
      });
    },
    [searchParams]
  );

  const handleClearAll = () => {
    startTransition(() => replace(pathname));
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
          searchParams={searchParams}
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
