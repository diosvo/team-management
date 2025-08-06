'use client';

import { useMemo } from 'react';

import { createListCollection, Portal, Select } from '@chakra-ui/react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field } from '@/components/ui/field';

import { RoleSelection as RoleItems } from '@/utils/constant';
import { UserRole } from '@/utils/enum';

interface RoleSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  disabled?: boolean;
  error?: string;
  onChange?: (role: UserRole) => void;
}

export function RoleSelection<T extends FieldValues>({
  control,
  name,
  disabled = false,
  error,
  onChange,
}: RoleSelectProps<T>) {
  const roles = useMemo(
    () =>
      createListCollection({
        items: RoleItems,
      }),
    []
  );

  return (
    <Field required label="Role" invalid={!!error} errorText={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select.Root
            collection={roles}
            name={field.name}
            value={field.value ? [field.value] : [UserRole.GUEST]}
            onValueChange={({ value }) => {
              field.onChange(value[0]);
              onChange?.(value[0] as UserRole);
            }}
            onInteractOutside={() => field.onBlur()}
            disabled={disabled}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Role" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {roles.items.map((role) => (
                    <Select.Item item={role} key={role.value}>
                      {role.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        )}
      />
    </Field>
  );
}
