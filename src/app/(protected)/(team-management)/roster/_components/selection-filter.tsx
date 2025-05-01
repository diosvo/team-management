'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useOptimistic, useState, useTransition } from 'react';

import { Button, CheckboxGroup, Grid, Popover, Portal } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';

import { RolesSelection, StatesSelection } from '@/utils/constant';
import { SelectableRole, SelectableState } from '@/utils/type';

import {
  FilterUsersSchema,
  FilterUsersValues,
} from '@/features/user/schemas/user';

export default function SelectionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [optimisticRoles, setOptimisticRoles] = useOptimistic(
    searchParams.get('roles')?.split(',')
  );
  const [optimisticState, setOptimisticState] = useOptimistic(
    searchParams.get('state')?.split(',')
  );

  const { control, reset, handleSubmit } = useForm({
    resolver: zodResolver(FilterUsersSchema),
  });

  const roles = useController({
    control,
    name: 'roles',
    defaultValue: optimisticRoles as Array<SelectableRole>,
  });

  const state = useController({
    control,
    name: 'state',
    defaultValue: optimisticState as Array<SelectableState>,
  });

  const checkboxCounter = useMemo(
    () => (roles.field.value?.length ?? 0) + (state.field.value?.length ?? 0),
    [roles.field.value, state.field.value]
  );

  const onSubmit = (values: FilterUsersValues) => {
    if (!checkboxCounter) return;

    const params = new URLSearchParams(searchParams);

    console.log(values);

    params.delete('roles');
    params.delete('state');

    if (values.roles.length > 0) {
      params.set('roles', values.roles.join(','));
      startTransition(() => {
        setOptimisticRoles(values.roles);
        router.push(`?${params.toString()}`);
      });
    }

    if (values.state.length > 0) {
      params.set('state', values.state.join(','));
      startTransition(() => {
        setOptimisticState(values.state);
        router.push(`?${params.toString()}`);
      });
    }

    setOpenPopover(false);
  };

  return (
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
            <form onSubmit={handleSubmit(onSubmit)}>
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
                  Reset
                </Button>
                <Button type="submit" size="sm" disabled={!checkboxCounter}>
                  Apply
                </Button>
              </Popover.Footer>
            </form>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
