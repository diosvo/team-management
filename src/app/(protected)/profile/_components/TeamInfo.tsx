'use client';

import { useState, useTransition } from 'react';

import {
  Badge,
  Card,
  HStack,
  IconButton,
  Input,
  InputGroup,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Edit, LucideClock9, Save, Shirt } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import TextField from '@/components/TextField';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { RolePositionSelection } from '@/components/user/RolePositionSelection';
import { ControlledStateSelection } from '@/components/user/StateSelection';
import Visibility from '@/components/Visibility';

import { ESTABLISHED_DATE } from '@/utils/constant';
import { UserRole } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';
import { colorRole, colorState, hasPermissions } from '@/utils/helper';

import { updateTeamInfo } from '@/actions/user';
import { User } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import { EditTeamInfoSchema, EditTeamInfoValues } from '@/schemas/user';

export default function TeamInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const { isAdmin } = usePermissions();
  const { isPlayer, isCoach } = hasPermissions(user.role);

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const {
    control,
    reset,
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { isDirty, isValid, errors },
  } = useForm({
    defaultValues: {
      user: {
        role: user?.role === UserRole.SUPER_ADMIN ? undefined : user.role,
        state: user?.state,
        join_date: user?.join_date,
      },
      player: {
        jersey_number: user.player?.jersey_number,
        position: user.player?.position,
      },
      coach: {
        position: user.coach?.position,
      },
    },
    resolver: zodResolver(EditTeamInfoSchema),
  });

  const selectedRole = watch('user.role');

  const onSubmit = (data: EditTeamInfoValues) => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        title: 'Updating team information...',
      });

      const { success, message: title } = await updateTeamInfo(user.id, data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });
      if (success) setIsEditing(false);
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
      _hover={{
        shadow: 'md',
        transition: 'all 0.2s',
      }}
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
            <Tooltip content={viewOnly ? 'View Only' : 'Edit'}>
              <IconButton
                size="sm"
                variant="subtle"
                disabled={viewOnly}
                onClick={() => setIsEditing(true)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
        </Card.Header>
      </HStack>
      <Card.Body gap={3}>
        {isEditing && isAdmin ? (
          <RolePositionSelection
            roleName="user.role"
            positionName={
              selectedRole === UserRole.COACH
                ? 'coach.position'
                : 'player.position'
            }
            control={control}
            disabled={isPending}
            setValue={setValue}
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }}>
            <TextField label="Role">
              <Badge
                variant="subtle"
                colorPalette={colorRole(user.role)}
                borderRadius="full"
              >
                {user.role}
              </Badge>
            </TextField>
            <Visibility isVisible={isPlayer || isCoach}>
              <TextField label="Position">
                <Badge variant="outline" borderRadius="full">
                  {isPlayer && user.player?.position}
                  {isCoach && user.coach?.position}
                </Badge>
              </TextField>
            </Visibility>
          </SimpleGrid>
        )}

        {isEditing && !viewOnly ? (
          <SimpleGrid
            columns={{
              base: 1,
              md: 3,
            }}
            gap={4}
          >
            <ControlledStateSelection
              control={control}
              name="user.state"
              disabled={isPending}
            />
            <Visibility isVisible={isPlayer}>
              <Field
                label="Jersey Number"
                invalid={!!errors.player?.jersey_number}
                errorText={errors.player?.jersey_number?.message}
              >
                <Controller
                  name="player.jersey_number"
                  control={control}
                  render={({ field }) => (
                    <NumberInputRoot
                      width="full"
                      disabled={field.disabled}
                      name={field.name}
                      value={String(field.value)}
                      onValueChange={({ value }) => field.onChange(value)}
                    >
                      <InputGroup startElement={'#'}>
                        <NumberInputField onBlur={field.onBlur} />
                      </InputGroup>
                    </NumberInputRoot>
                  )}
                />
              </Field>
            </Visibility>
            <Field label="Join Date">
              <Input
                type="date"
                min={ESTABLISHED_DATE}
                disabled={isPending}
                {...register('user.join_date')}
              />
            </Field>
          </SimpleGrid>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2 }}>
              <TextField label="State" direction="horizontal" icon={Activity}>
                <Badge
                  variant="surface"
                  borderRadius="full"
                  colorPalette={colorState(user.state)}
                >
                  {user.state}
                </Badge>
              </TextField>
              <Visibility isVisible={isPlayer}>
                <TextField
                  label="Jersey Number"
                  direction="horizontal"
                  icon={Shirt}
                >
                  {user.player?.jersey_number ?? '-'}
                </TextField>
              </Visibility>
            </SimpleGrid>
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
          </>
        )}
      </Card.Body>
    </Card.Root>
  );
}
