'use client';

import { useMemo, useState } from 'react';

import { Button, CheckboxGroup, Grid, Popover, Portal } from '@chakra-ui/react';
import { Filter } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';

import { RolesSelection, StatesSelection } from '@/utils/constant';
import { SelectableRole, SelectableState } from '@/utils/type';

import { useFilters } from '../_helpers/use-filters';

export default function SelectionFilter() {
  const { filters, isPending, updateFilters } = useFilters();
  const [selection, setSelection] = useState({
    roles: filters.roles,
    state: filters.state,
  });
  const [openPopover, setOpenPopover] = useState<boolean>(false);

  const checkboxCounter = useMemo(
    () => (selection.roles || []).length + (selection.state || []).length,
    [selection]
  );

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
            <Popover.Arrow />
            <Popover.Body>
              <>
                <Popover.Title fontWeight="medium" mb={2}>
                  State
                </Popover.Title>
                <CheckboxGroup
                  name="state"
                  value={selection.state}
                  onValueChange={(value: Array<string>) => {
                    setSelection((prev) => ({
                      ...prev,
                      state: value as Array<SelectableState>,
                    }));
                  }}
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
                  name="roles"
                  value={selection.roles}
                  onValueChange={(value: Array<string>) => {
                    setSelection((prev) => ({
                      ...prev,
                      roles: value as Array<SelectableRole>,
                    }));
                  }}
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
                onClick={() =>
                  setSelection({
                    roles: [],
                    state: [],
                  })
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={!checkboxCounter}
                onClick={() => {
                  updateFilters(selection);
                  setOpenPopover(false);
                }}
              >
                Apply
              </Button>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
