'use client';

import { useEffect, useMemo } from 'react';

import {
  createListCollection,
  HStack,
  Portal,
  Select,
  SelectRootProps,
  Span,
  Stack,
} from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { Field } from '@/components/ui/field';

import {
  CoachPositionsSelection,
  PlayerPositionsSelection,
  UserRoleSelection,
} from '@/utils/constant';
import { PlayerPosition, UserRole } from '@/utils/enum';
import { Option } from '@/utils/type';

type StateRoleProps = Omit<SelectRootProps, 'collection'> &
  Partial<{
    placeholder: string;
    contentRef: React.RefObject<Nullable<HTMLDivElement>>;
  }>;

const roles = createListCollection({
  items: UserRoleSelection,
});

export function RoleSelection({
  contentRef,
  placeholder = 'Role',
  ...props
}: StateRoleProps) {
  return (
    <Select.Root {...props} collection={roles}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          {props.multiple && <Select.ClearTrigger />}
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal container={contentRef}>
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
  );
}

type RoleSelectProps<T extends FieldValues> = {
  control: Control<T>;
  roleName: FieldPath<T>;
  positionName: FieldPath<T>;
  contentRef?: React.RefObject<Nullable<HTMLDivElement>>;
  disabled?: boolean;
  setValue: UseFormSetValue<T>;
};

export function RolePositionSelection<T extends FieldValues>({
  control,
  roleName,
  positionName,
  contentRef,
  disabled = false,
  setValue,
}: RoleSelectProps<T>) {
  const selectedRole = useWatch({
    control,
    name: roleName,
  });
  const selectedPosition = useWatch({
    control,
    name: positionName,
  });

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

  const disabledPosition =
    disabled || positions.items.length === 0 || selectedRole === UserRole.GUEST;

  // Handle role change and position updates
  useEffect(() => {
    if (!selectedRole) return;

    setValue(
      positionName,
      (selectedRole === UserRole.GUEST
        ? undefined
        : selectedPosition || PlayerPosition.UNKNOWN) as T[typeof positionName]
    );
  }, [selectedRole]);

  return (
    <HStack width="inherit" gap={4}>
      <Field required label="Role">
        <Controller
          control={control}
          name={roleName}
          render={({ field }) => (
            <RoleSelection
              name={field.name}
              defaultValue={[UserRole.GUEST]}
              value={[field.value]}
              disabled={disabled}
              contentRef={contentRef}
              onInteractOutside={() => field.onBlur()}
              onValueChange={({ value }) => field.onChange(value[0])}
            />
          )}
        />
      </Field>

      <Field label="Position">
        <Controller
          control={control}
          name={positionName}
          render={({ field }) => (
            <Select.Root
              name={field.name}
              value={[field.value]}
              onValueChange={({ value }) => field.onChange(value[0])}
              onInteractOutside={() => field.onBlur()}
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
              <Portal container={contentRef}>
                <Select.Positioner>
                  <Select.Content>
                    {positions.items.map((position) => (
                      <Select.Item item={position} key={position.value}>
                        <Stack gap={0}>
                          <Select.ItemText>{position.label}</Select.ItemText>
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
    </HStack>
  );
}
