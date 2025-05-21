'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button, CheckboxGroup, Grid, Popover, Portal } from '@chakra-ui/react';
import { Filter } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';

import { RoleSelection, StatesSelection } from '@/utils/constant';
import { SelectableRole, SelectableState } from '@/utils/type';

import { useFilters } from '../_helpers/use-filters';

export default function SelectionFilter() {
  const { filters, isPending, updateFilters } = useFilters();
  const [selection, setSelection] = useState({
    role: filters.role,
    state: filters.state,
  });
  const [openPopover, setOpenPopover] = useState<boolean>(false);

  useEffect(() => {
    setSelection((prev) => ({
      ...prev,
      role: filters.role,
      state: filters.state,
    }));
  }, [filters.state, filters.role]);

  const checkboxCounter = useMemo(
    () => (selection.role || []).length + (selection.state || []).length,
    [selection]
  );

  return (
    <Popover.Root
      open={openPopover}
      onOpenChange={(e) => setOpenPopover(e.open)}
    >
      <Popover.Trigger asChild>
        <Button
          variant="surface"
          size={{ base: 'sm', md: 'md' }}
          disabled={isPending}
        >
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
                <Popover.Title fontWeight="medium" marginBottom={2}>
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
                <Popover.Title
                  fontWeight="medium"
                  marginBottom={2}
                  marginTop={4}
                >
                  Role
                </Popover.Title>
                <CheckboxGroup
                  name="role"
                  value={selection.role}
                  onValueChange={(value: Array<string>) => {
                    setSelection((prev) => ({
                      ...prev,
                      role: value as Array<SelectableRole>,
                    }));
                  }}
                >
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    {RoleSelection.map((item) => (
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
                    role: [],
                    state: [],
                  })
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
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
