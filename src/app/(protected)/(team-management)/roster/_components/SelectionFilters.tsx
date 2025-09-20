'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  CheckboxGroup,
  HStack,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Filter } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

import { RoleSelection, StateSelection } from '@/utils/constant';
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

  const checkboxCounter =
    (selection.role || []).length + (selection.state || []).length;

  return (
    <PopoverRoot
      open={openPopover}
      onOpenChange={(e) => setOpenPopover(e.open)}
    >
      <PopoverTrigger asChild>
        <Button
          variant="surface"
          size={{ base: 'sm', md: 'md' }}
          disabled={isPending}
        >
          <Filter />
          Filters {checkboxCounter > 0 ? '(' + checkboxCounter + ')' : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <>
            <PopoverTitle marginBottom={2}>
              <HStack justifyContent="space-between" alignItems="baseline">
                <Text fontWeight="medium">State</Text>
                <Text
                  textStyle="xs"
                  color="GrayText"
                  _hover={{
                    cursor: selection.state.length ? 'pointer' : 'not-allowed',
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
            </PopoverTitle>
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
              <SimpleGrid columns={2} gap={4}>
                {StateSelection.map((item) => (
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
              </SimpleGrid>
            </CheckboxGroup>
          </>
          <>
            <PopoverTitle marginBlock={2}>
              <HStack justifyContent="space-between" alignItems="baseline">
                <Text fontWeight="medium">Role</Text>
                <Text
                  textStyle="xs"
                  color="GrayText"
                  _hover={{
                    cursor: selection.role.length ? 'pointer' : 'not-allowed',
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
            </PopoverTitle>
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
              <SimpleGrid columns={3} gap={4}>
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
              </SimpleGrid>
            </CheckboxGroup>
          </>
        </PopoverBody>
        <PopoverFooter justifyContent="flex-end">
          <Button
            size="sm"
            onClick={() => {
              updateFilters(selection);
              setOpenPopover(false);
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </PopoverRoot>
  );
}
