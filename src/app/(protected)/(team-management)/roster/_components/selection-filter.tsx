'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  CheckboxGroup,
  Grid,
  HStack,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
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
                <Popover.Title marginBottom={2}>
                  <HStack justifyContent="space-between" alignItems="baseline">
                    <Text fontWeight="medium">State</Text>
                    <Text
                      textStyle="xs"
                      color="GrayText"
                      _hover={{
                        cursor: selection.state.length
                          ? 'pointer'
                          : 'not-allowed',
                        color: selection.state.length ? 'tomato' : 'GrayText',
                      }}
                      onClick={() =>
                        setSelection((prevState) => ({
                          ...prevState,
                          state: [],
                        }))
                      }
                    >
                      clear
                    </Text>
                  </HStack>
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
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
                  </Grid>
                </CheckboxGroup>
              </>
              <>
                <Popover.Title marginBlock={2}>
                  <HStack justifyContent="space-between" alignItems="baseline">
                    <Text fontWeight="medium">Role</Text>
                    <Text
                      textStyle="xs"
                      color="GrayText"
                      _hover={{
                        cursor: selection.role.length
                          ? 'pointer'
                          : 'not-allowed',
                        color: selection.role.length ? 'tomato' : 'GrayText',
                      }}
                      onClick={() =>
                        setSelection((prevState) => ({
                          ...prevState,
                          role: [],
                        }))
                      }
                    >
                      clear
                    </Text>
                  </HStack>
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
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
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
            <Popover.Footer justifyContent="flex-end">
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
