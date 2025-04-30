'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Button, HStack } from '@chakra-ui/react';
import { Trash2, UserRoundPlus } from 'lucide-react';

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

  const searchParams = useSearchParams();
  // Read the current URL's pathname
  const pathname = usePathname();
  // Enable navigation between routes within client components programmatically
  const { replace } = useRouter();

  const [isPending, startTransition] = useTransition();
  const [openPopover, setOpenPopover] = useState<boolean>(false);

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
    params.forEach((_, key) => params.delete(key));
    startTransition(() => replace(`${pathname}?${params.toString()}`));
  };

  return (
    <HStack marginBlock={6}>
      <SearchBar isPending={isPending} onSearch={handleSearch} />

      <SelectionFilter
        open={openPopover}
        onOpenChange={setOpenPopover}
        onFilter={handleSelection}
      />

      <Button
        variant="outline"
        disabled={!searchParams.toString()}
        onClick={handleClearAll}
      >
        <Trash2 color="red" />
        Clear All Search
      </Button>

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
  );
}
