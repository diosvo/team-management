'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import {
  Button,
  CheckboxGroup,
  Grid,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Popover,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter, Search, Trash2, UserRoundPlus } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import { RolesSelection, StatesSelection } from '@/utils/constant';

import { CloseButton } from '@/components/ui/close-button';
import {
  FilterUsersSchema,
  FilterUsersValues,
} from '@/features/user/schemas/user';
import { UserRole, UserState } from '@/utils/enum';
import AddUser from './add-user';

export default function RosterActions({
  emailExists,
}: {
  emailExists: Array<string>;
}) {
  const searchParams = useSearchParams(); // Access the parameters of the current URL
  const pathname = usePathname(); // Read the current URL's pathname
  const { replace } = useRouter(); // Enable navigation between routes within client components programmatically

  const isAdmin = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const { control, reset, handleSubmit } = useForm({
    resolver: zodResolver(FilterUsersSchema),
  });
  const query = useController({
    control,
    name: 'query',
    defaultValue: searchParams.get('query')?.toString(),
  });
  const roles = useController({
    control,
    name: 'roles',
    defaultValue: searchParams.get('roles')?.split(',') as Array<
      UserRole.COACH | UserRole.PLAYER | UserRole.CAPTAIN | UserRole.GUEST
    >,
  });
  const state = useController({
    control,
    name: 'state',
    defaultValue: searchParams.get('state')?.split(',') as Array<UserState>,
  });

  const handleSearch = (term: string) => {
    console.log(`Searching... ${term}`);

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

  const handleFilter = ({ state, roles }: FilterUsersValues) => {
    console.log(`Filtering...`, state, roles);

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

  const clearAllFilters = () => {
    console.log('Clearing all filters...');
    const params = new URLSearchParams(searchParams);
    params.delete('state');
    params.delete('roles');
    params.delete('query');
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <HStack marginBlock={6}>
      <InputGroup
        flex="1"
        startElement={
          isPending ? (
            <Spinner size="xs" colorPalette="gray" borderWidth="1px" />
          ) : (
            <Search size={14} />
          )
        }
        endElement={
          searchParams.get('query')?.toString() ? (
            <CloseButton
              size="xs"
              onClick={() => {
                query.field.onChange('');
                handleSearch(query.field.value as string);
                inputRef.current?.focus();
              }}
              me="-2"
            />
          ) : (
            <Kbd size="sm">Enter</Kbd>
          )
        }
      >
        <Input
          ref={inputRef}
          borderWidth="1px"
          placeholder="Search..."
          name="search-roster"
          css={{ '--focus-color': 'colors.red.300' }}
          onChange={query.field.onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e.currentTarget.value);
            }
          }}
        />
      </InputGroup>

      <Popover.Root
        open={openPopover}
        onOpenChange={(e) => setOpenPopover(e.open)}
      >
        <Popover.Trigger asChild>
          <Button variant="surface">
            <Filter />
            Filters
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content width={{ base: '2xs' }}>
              <form onSubmit={handleSubmit(handleFilter)}>
                <Popover.Arrow />
                <Popover.Body>
                  <>
                    <Popover.Title fontWeight="medium" mb={2}>
                      State
                    </Popover.Title>
                    <CheckboxGroup
                      name={state.field.name}
                      value={state.field.value}
                      onValueChange={state.field.onChange}
                    >
                      {StatesSelection.map((item) => (
                        <Checkbox
                          key={item.value}
                          value={item.value}
                          variant="outline"
                          colorPalette="gray"
                          aria-label={item.label}
                        >
                          {item.label}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </>
                  <>
                    <Popover.Title fontWeight="medium" mb={2} mt={4}>
                      Roles
                    </Popover.Title>
                    <CheckboxGroup
                      name={roles.field.name}
                      value={roles.field.value}
                      onValueChange={roles.field.onChange}
                    >
                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        {RolesSelection.map((item) => (
                          <Checkbox
                            key={item.value}
                            value={item.value}
                            variant="outline"
                            colorPalette="gray"
                            aria-label={item.label}
                          >
                            {item.label}
                          </Checkbox>
                        ))}
                      </Grid>
                    </CheckboxGroup>
                  </>
                </Popover.Body>
                <Popover.Footer justifyContent="space-between">
                  <Button
                    type="reset"
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => reset()}
                  >
                    Restore
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    onClick={() => setOpenPopover(false)}
                  >
                    Apply
                  </Button>
                </Popover.Footer>
              </form>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      <Button
        variant="outline"
        disabled={!searchParams.toString()}
        onClick={clearAllFilters}
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
