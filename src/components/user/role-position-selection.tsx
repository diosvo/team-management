'use client';

import { useMemo } from 'react';

import {
  createListCollection,
  HStack,
  Portal,
  Select,
  Span,
  Stack,
} from '@chakra-ui/react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field } from '@/components/ui/field';

import {
  CoachPositionsSelection,
  PlayerPositionsSelection,
  RoleSelection as RoleItems,
} from '@/utils/constant';
import { PlayerPosition, UserRole } from '@/utils/enum';
import { Option } from '@/utils/type';

interface RoleSelectProps<T extends FieldValues> {
  control: Control<T>;
  roleName: FieldPath<T>;
  positionName: FieldPath<T>;
  disabled?: boolean;
}

export default function RolePositionSelection<T extends FieldValues>({
  control,
  roleName,
  positionName,
  disabled = false,
}: RoleSelectProps<T>) {
  const roles = useMemo(
    () =>
      createListCollection({
        items: RoleItems,
      }),
    []
  );

  return (
    <HStack width="inherit">
      <Field required label="Role">
        <Controller
          control={control}
          name={roleName}
          render={({ field: roleField }) => (
            <Select.Root
              collection={roles}
              name={roleField.name}
              value={roleField.value ? [roleField.value] : [UserRole.GUEST]}
              onValueChange={({ value }) => roleField.onChange(value[0])}
              onInteractOutside={() => roleField.onBlur()}
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

      <Controller
        control={control}
        name={roleName}
        render={({ field: roleField }) => {
          const selectedRole = roleField.value;

          const positions = useMemo(() => {
            const mapped = {
              [UserRole.COACH]: CoachPositionsSelection,
              [UserRole.PLAYER]: PlayerPositionsSelection,
              [UserRole.GUEST]: [],
            };
            return createListCollection<Option<string>>({
              items: selectedRole ? mapped[selectedRole] : [],
            });
          }, [selectedRole]);

          const disabledPosition = useMemo(() => {
            return (
              disabled ||
              positions.items.length === 0 ||
              selectedRole === UserRole.GUEST
            );
          }, [disabled, positions.items.length, selectedRole]);

          return (
            <Field label="Position">
              <Controller
                control={control}
                name={positionName}
                render={({ field: positionField }) => (
                  <Select.Root
                    name={positionField.name}
                    value={
                      positionField.value
                        ? [positionField.value]
                        : [PlayerPosition.UNKNOWN]
                    }
                    onValueChange={({ value }) =>
                      positionField.onChange(value[0])
                    }
                    onInteractOutside={() => positionField.onBlur()}
                    collection={positions}
                    disabled={disabledPosition}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Position" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {positions.items.map((position) => (
                            <Select.Item item={position} key={position.value}>
                              <Stack gap={0}>
                                <Select.ItemText>
                                  {position.label}
                                </Select.ItemText>
                                <Span color="fg.muted" textStyle="xs">
                                  {position.description}
                                </Span>
                              </Stack>
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
        }}
      />
    </HStack>
  );
}
