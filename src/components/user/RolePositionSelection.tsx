import { useEffect, useMemo } from 'react';

import {
  createListCollection,
  Portal,
  Select,
  type SelectRootProps,
  Span,
  Stack,
} from '@chakra-ui/react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Field } from '@/components/ui/field';
import { useSelection } from '@/i18n/enums';

import {
  COACH_POSITIONS_SELECTION,
  PLAYER_POSITIONS_SELECTION,
  USER_ROLE_SELECTION,
} from '@/utils/constants';
import { PlayerPosition, UserRole } from '@/utils/enum';
import type { Option } from '@/utils/type';

type StateRoleProps = Omit<SelectRootProps, 'collection'> &
  Partial<{
    placeholder: string;
    contentRef: React.RefObject<Nullable<HTMLDivElement>>;
  }>;

export function RoleSelection({
  contentRef,
  placeholder,
  ...props
}: StateRoleProps) {
  const t = useTranslations('components.rolePositionSelection');
  const roles = createListCollection({
    items: useSelection(USER_ROLE_SELECTION, 'userRole'),
  });

  return (
    <Select.Root {...props} collection={roles}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={placeholder ?? t('role')} />
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
  const t = useTranslations('components.rolePositionSelection');
  const coachPositions = useSelection(
    COACH_POSITIONS_SELECTION,
    'coachPosition',
  );
  const playerPositions = useSelection(
    PLAYER_POSITIONS_SELECTION,
    'playerPosition',
  );
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
      [UserRole.COACH]: coachPositions,
      [UserRole.PLAYER]: playerPositions,
      [UserRole.GUEST]: [],
    };
    return createListCollection<Option<string>>({
      items: selectedRole ? mapped[selectedRole] : [],
    });
  }, [selectedRole, coachPositions, playerPositions]);

  const disabledPosition =
    disabled || positions.items.length === 0 || selectedRole === UserRole.GUEST;

  // Handle role change and position updates
  useEffect(() => {
    if (!selectedRole) return;

    setValue(
      positionName,
      (selectedRole === UserRole.GUEST
        ? undefined
        : selectedPosition || PlayerPosition.UNKNOWN) as T[typeof positionName],
    );
  }, [selectedRole]);

  return (
    <Stack direction={{ base: 'column', sm: 'row' }} width="inherit" gap={4}>
      <Field required label={t('role')}>
        <Controller
          control={control}
          name={roleName}
          render={({ field }) => (
            <RoleSelection
              name={field.name}
              value={[field.value]}
              disabled={disabled}
              contentRef={contentRef}
              onInteractOutside={() => field.onBlur()}
              onValueChange={({ value }) => field.onChange(value[0])}
            />
          )}
        />
      </Field>

      <Field label={t('position')}>
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
                  <Select.ValueText placeholder={t('position')} />
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
    </Stack>
  );
}
