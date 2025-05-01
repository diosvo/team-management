'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';

import {
  Button,
  CheckboxGroup,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Popover,
  Portal,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter, Search, UserRoundPlus } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { FilterUsersSchema } from '@/features/user/schemas/user';
import { usePermissions } from '@/hooks/use-permissions';

import { Checkbox } from '@/components/ui/checkbox';
import { CloseButton } from '@/components/ui/close-button';
import { RolesSelection, StatesSelection } from '@/utils/constant';
import { SelectableRole, SelectableState } from '@/utils/type';
import AddUser from './add-user';

const Q_KEY = 'query';

export default function RosterActions({
  emailExists,
}: {
  emailExists: Array<string>;
}) {
  const isAdmin = usePermissions();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [optimisticRoles, setOptimisticRoles] = useOptimistic<
    Array<SelectableRole>
  >((searchParams.get('roles')?.split(',') as Array<SelectableRole>) || []);
  const [optimisticState, setOptimisticState] = useOptimistic<
    Array<SelectableState>
  >((searchParams.get('state')?.split(',') as Array<SelectableState>) || []);
  const inputRef = useRef<HTMLInputElement>(null);

  const { control, reset } = useForm({
    resolver: zodResolver(FilterUsersSchema),
    defaultValues: {
      query: searchParams.get(Q_KEY) || '',
      roles: optimisticRoles,
      state: optimisticState,
    },
  });
  const query = useController({
    control,
    name: 'query',
    defaultValue: searchParams.get('query')?.toString() || '',
  });
  const roles = useController({
    control,
    name: 'roles',
    defaultValue: optimisticRoles,
  });
  const state = useController({
    control,
    name: 'state',
    defaultValue: optimisticState,
  });

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    term ? params.set(Q_KEY, term) : params.delete(Q_KEY);

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleClear = () => {
    handleSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e.currentTarget.value);
    }
  };

  const checkboxCounter = useMemo(
    () => (roles.field.value?.length ?? 0) + (state.field.value?.length ?? 0),
    [roles.field.value, state.field.value]
  );

  const handleSelection = () => {
    if (!checkboxCounter) return;

    const params = new URLSearchParams(searchParams);

    params.delete('roles');
    params.delete('state');

    if ((roles.field.value ?? []).length > 0) {
      params.set('roles', roles.field.value!.join(','));
      startTransition(() => {
        setOptimisticRoles(roles.field.value!);
      });
    }

    if ((state.field.value ?? []).length > 0) {
      params.set('state', state.field.value!.join(','));
      startTransition(() => {
        setOptimisticState(state.field.value!);
      });
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });

    setOpenPopover(false);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();

    // Reset form fields
    reset({
      query: '',
      roles: [],
      state: [],
    });

    // Reset optimistic states
    startTransition(() => {
      setOptimisticRoles([]);
      setOptimisticState([]);
      router.replace(pathname);
    });
  };

  // Update form values when URL parameters change
  useEffect(() => {
    reset({
      query: searchParams.get(Q_KEY) || '',
      roles:
        (searchParams.get('roles')?.split(',') as Array<SelectableRole>) || [],
      state:
        (searchParams.get('state')?.split(',') as Array<SelectableState>) || [],
    });
  }, [searchParams, reset]);

  return (
    <VStack align="stretch">
      <HStack justifyContent="space-between">
        <Heading size="2xl">Team Roster</Heading>
        <Button
          variant="plain"
          textDecoration="underline"
          _hover={{ color: 'tomato' }}
          disabled={!searchParams.toString() || isPending}
          onClick={clearAllFilters}
        >
          Clear all search
        </Button>
      </HStack>

      <HStack marginBlock={2}>
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
            searchParams.get(Q_KEY) ? (
              <CloseButton
                size="2xs"
                borderRadius="full"
                onClick={handleClear}
              />
            ) : (
              <Kbd size="sm">Enter</Kbd>
            )
          }
        >
          <Input
            ref={inputRef}
            maxLength={50}
            borderWidth="1px"
            name="search-bar"
            placeholder="Search..."
            css={{ '--focus-color': 'colors.red.200' }}
            value={query.field.value}
            onChange={query.field.onChange}
            onKeyDown={handleKeyDown}
          />
        </InputGroup>
        <Popover.Root
          open={openPopover}
          onOpenChange={(e) => setOpenPopover(e.open)}
        >
          <Popover.Trigger asChild>
            <Button variant="surface" disabled={isPending}>
              <Filter />
              Filters {checkboxCounter > 0 ? '(' + checkboxCounter + ')' : null}
            </Button>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content width={{ base: '2xs' }}>
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
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    disabled={!checkboxCounter}
                    onClick={handleSelection}
                  >
                    Apply
                  </Button>
                </Popover.Footer>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
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
