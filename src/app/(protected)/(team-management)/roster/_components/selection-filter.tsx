'use client';

import { useSearchParams } from 'next/navigation';

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

interface SelectionFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilter: (
    state: Array<SelectableState>,
    roles: Array<SelectableRole>
  ) => void;
}

export default function SelectionFilter({
  open,
  onOpenChange,
  onFilter,
}: SelectionFilterProps) {
  const searchParams = useSearchParams();
  const { control, reset, handleSubmit } = useForm({
    resolver: zodResolver(FilterUsersSchema),
  });

  const roles = useController({
    control,
    name: 'roles',
    defaultValue: searchParams
      .get('roles')
      ?.split(',') as Array<SelectableRole>,
  });

  const state = useController({
    control,
    name: 'state',
    defaultValue: searchParams
      .get('state')
      ?.split(',') as Array<SelectableState>,
  });

  const onSubmit = (values: FilterUsersValues) => {
    onFilter(values.state, values.roles);
    onOpenChange(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Popover.Trigger asChild>
        <Button variant="surface">
          <Filter />
          Filters
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
                <Button type="submit" size="sm">
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
