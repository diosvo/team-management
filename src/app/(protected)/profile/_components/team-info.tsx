'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  Badge,
  Card,
  createListCollection,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Portal,
  Select,
  Span,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Edit, LucideClock9, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import TextField from '@/components/text-field';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema/user';
import { usePermissions } from '@/hooks/use-permissions';
import {
  CoachPositionsSelection,
  ESTABLISHED_DATE,
  PlayerPositionsSelection,
  RoleSelection,
  StateSelection,
} from '@/utils/constant';
import { UserRole, UserState } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';
import { colorRole, colorState, hasPermissions } from '@/utils/helper';

import { Status } from '@/components/ui/status';
import { updateTeamInfo } from '@/features/user/actions/user';
import {
  EditTeamInfoSchema,
  EditTeamInfoValues,
} from '@/features/user/schemas/user';

const roles = createListCollection({
  items: RoleSelection,
});

const states = createListCollection({
  items: StateSelection,
});

export default function TeamInfo({
  user,
  viewOnly,
  isOwnProfile,
}: {
  user: User;
  viewOnly: boolean;
  isOwnProfile: boolean;
}) {
  const { isAdmin } = usePermissions();
  const { isPlayer } = hasPermissions(user.role);

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const canEdit = useMemo(() => {
    // Do NOT enable button if:
    // 1. Current profile is Admin
    // 2. View only mode
    if ((isOwnProfile && isAdmin) || viewOnly) return false;

    return true;
  }, [isOwnProfile, isAdmin, viewOnly]);

  const canEditJerseyNumber = useMemo(() => {
    return isAdmin || isOwnProfile;
  }, [isOwnProfile, isAdmin]);

  const {
    reset,
    watch,
    control,
    register,
    setValue,
    handleSubmit,
    formState: { isDirty, isValid, errors },
  } = useForm({
    values: {
      user: {
        role: user.role === UserRole.SUPER_ADMIN ? undefined : user.role,
        state: user.state,
        join_date: user.join_date,
      },
      player: {
        jersey_number: user.details.jersey_number,
      },
      position: user.details.position,
    },
    resolver: zodResolver(EditTeamInfoSchema),
  });

  const selectedRole = watch('user.role');

  const positions = useMemo(() => {
    const mapped = {
      [UserRole.COACH]: CoachPositionsSelection,
      [UserRole.PLAYER]: PlayerPositionsSelection,
      [UserRole.GUEST]: [],
    };
    return createListCollection({
      items: selectedRole ? mapped[selectedRole] : [],
    });
  }, [selectedRole]);

  const onSubmit = (data: EditTeamInfoValues) => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        description: 'Updating team information...',
      });

      const { error, message: description } = await updateTeamInfo(
        user.user_id,
        data
      );

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) {
        setIsEditing(false);
      }
    });
  };

  const onCancel = () => {
    setIsEditing(false);
    reset();
  };

  return (
    <Card.Root
      as="form"
      size="sm"
      _hover={{ shadow: 'sm' }}
      transition="all 0.2s"
      onSubmit={handleSubmit(onSubmit)}
    >
      <HStack
        borderBottom={1}
        borderBottomStyle="solid"
        borderBottomColor="gray.200"
        asChild
      >
        <Card.Header paddingBlock={2}>
          <Card.Title marginRight="auto">Team Information</Card.Title>
          {isEditing ? (
            <>
              <CloseButton size="sm" variant="outline" onClick={onCancel} />
              <Tooltip content="Save" disabled={isPending}>
                <IconButton
                  size="sm"
                  type="submit"
                  disabled={!isDirty || !isValid || isPending}
                >
                  <Save />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip content={canEdit ? 'Edit' : 'View Only'}>
              <IconButton
                size="sm"
                variant="subtle"
                disabled={!canEdit}
                onClick={() => setIsEditing(true)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
        </Card.Header>
      </HStack>
      <Card.Body>
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          <Visibility isVisible={isPlayer}>
            {isEditing && canEditJerseyNumber ? (
              <Field
                label="Jersey Number"
                invalid={!!errors.player?.jersey_number}
                errorText={errors.player?.jersey_number?.message}
              >
                <InputGroup startElement={'#'}>
                  <Input
                    disabled={isPending}
                    {...register('player.jersey_number')}
                  />
                </InputGroup>
              </Field>
            ) : (
              <TextField label="Jersey Number">
                {user.details.jersey_number ? (
                  '# ' + user.details.jersey_number
                ) : (
                  <Text>-</Text>
                )}
              </TextField>
            )}
          </Visibility>

          {isEditing && isAdmin ? (
            <Field
              required
              label="Role"
              invalid={!!errors.user?.role}
              errorText={errors.user?.role?.message}
            >
              <Controller
                control={control}
                name="user.role"
                render={({ field }) => (
                  <Select.Root
                    name={field.name}
                    value={field.value ? [field.value] : [UserRole.GUEST]}
                    onValueChange={({ value }) => {
                      setValue('position', null);
                      field.onChange(value[0]);
                    }}
                    onInteractOutside={() => field.onBlur()}
                    collection={roles}
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
          ) : (
            <TextField label="Role">
              <Badge
                variant="subtle"
                colorPalette={colorRole(user.role)}
                borderRadius="full"
              >
                {user.role}
              </Badge>
            </TextField>
          )}

          {isEditing && isAdmin ? (
            <Field
              label="Position"
              disabled={isPending || selectedRole === UserRole.GUEST}
            >
              <Controller
                control={control}
                name="position"
                render={({ field }) => (
                  <Select.Root
                    name={field.name}
                    value={field.value ? [field.value] : ['UNKNOWN']}
                    onValueChange={({ value }) => field.onChange(value[0])}
                    onInteractOutside={() => field.onBlur()}
                    collection={positions}
                    disabled={isPending || selectedRole === UserRole.GUEST}
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
          ) : (
            <TextField label="Position">
              {user.details.position ? (
                <Badge variant="outline" borderRadius="full">
                  {user.details.position}
                </Badge>
              ) : (
                <Text>-</Text>
              )}
            </TextField>
          )}
        </Grid>
      </Card.Body>

      <Card.Footer asChild>
        {isEditing && canEdit ? (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
            }}
            gap={4}
          >
            <Field label="State">
              <Controller
                control={control}
                name="user.state"
                render={({ field }) => (
                  <Select.Root
                    name={field.name}
                    value={field.value ? [field.value] : [UserState.UNKNOWN]}
                    onValueChange={({ value }) => field.onChange(value[0])}
                    onInteractOutside={() => field.onBlur()}
                    collection={states}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="State" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {states.items.map((state) => (
                            <Select.Item item={state} key={state.value}>
                              <Status colorPalette={colorState(state.value)}>
                                {state.label}
                              </Status>
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
            <Field label="Join Date">
              <Input
                type="date"
                min={ESTABLISHED_DATE}
                defaultValue={ESTABLISHED_DATE}
                disabled={isPending}
                {...register('user.join_date')}
              />
            </Field>
          </Grid>
        ) : (
          <VStack align="flex-start" width="max-content">
            <TextField label="State" direction="horizontal" icon={Activity}>
              <Badge
                variant="surface"
                borderRadius="full"
                colorPalette={colorState(user.state)}
              >
                {user.state}
              </Badge>
            </TextField>
            {user.join_date && (
              <TextField
                label="Joined Date"
                direction="horizontal"
                icon={LucideClock9}
              >
                <Text>
                  {formatDate(user.join_date)}
                  <Text as="span" fontSize="sm" color="GrayText" marginLeft={1}>
                    (
                    {formatDistanceToNow(user.join_date, {
                      addSuffix: true,
                    })}
                    )
                  </Text>
                </Text>
              </TextField>
            )}
          </VStack>
        )}
      </Card.Footer>
    </Card.Root>
  );
}
