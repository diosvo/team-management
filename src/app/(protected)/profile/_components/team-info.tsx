'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  Badge,
  Card,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { Edit, LucideClock9, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/text-field';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import {
  CoachPositionsSelection,
  PlayerPositionsSelection,
  RoleSelection,
} from '@/utils/constant';
import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';
import { colorRole, hasPermissions } from '@/utils/helper';

import { EditTeamInfoSchema } from '@/features/user/schemas/user';
import { usePermissions } from '@/hooks/use-permissions';

export default function TeamInfo({ user }: { user: User }) {
  const { isAdmin } = usePermissions();
  const { isPlayer } = hasPermissions(user.role);

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const {
    reset,
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditTeamInfoSchema),
    defaultValues: {
      user: {
        role: UserRole.GUEST,
        state: user.state,
      },
      player: {
        jersey_number: user.details.jersey_number,
      },
      position: user.details.position,
    },
  });

  const selectedRole = watch('user.role');

  useEffect(() => {
    if (selectedRole === UserRole.GUEST) {
      setValue('position', undefined);
    } else if (selectedRole === UserRole.COACH) {
      setValue('position', CoachPosition.UNKNOWN);
    } else if (selectedRole === UserRole.PLAYER) {
      setValue('position', PlayerPosition.UNKNOWN);
    }
  }, [selectedRole, setValue]);

  return (
    <Card.Root size="sm" _hover={{ shadow: 'sm' }} transition="all 0.2s">
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
              <CloseButton
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              />
              <Tooltip content="Save" disabled>
                <IconButton size="sm" disabled>
                  <Save />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip
              content={
                isAdmin && user.role === UserRole.SUPER_ADMIN
                  ? 'Cannot edit Admin role'
                  : 'Edit'
              }
            >
              <IconButton
                size="sm"
                variant="subtle"
                disabled={isAdmin && user.role === UserRole.SUPER_ADMIN}
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
            {isEditing ? (
              <Field
                label="Jersey Number"
                invalid={!!errors.player?.jersey_number}
                errorText={errors.player?.jersey_number?.message}
              >
                <InputGroup startElement={'#'}>
                  <Input
                    defaultValue={user.details.jersey_number || ''}
                    disabled={isPending}
                    {...register('player.jersey_number')}
                  />
                </InputGroup>
              </Field>
            ) : (
              <TextField label="Jersey Number">
                {user.details.jersey_number ? (
                  <Badge variant="outline" rounded="full">
                    {user.details.jersey_number}
                  </Badge>
                ) : (
                  <Text>-</Text>
                )}
              </TextField>
            )}
          </Visibility>

          {isEditing && isAdmin ? (
            <Field required label="Role">
              <Select
                collection={RoleSelection}
                disabled={isPending}
                {...register('user.role')}
              />
            </Field>
          ) : (
            <TextField label="Role">
              <Badge
                variant="subtle"
                colorPalette={colorRole(user.role)}
                rounded="full"
              >
                {user.role}
              </Badge>
            </TextField>
          )}

          {isEditing && isAdmin ? (
            <Field label="Position">
              <Select
                collection={
                  selectedRole === UserRole.COACH
                    ? CoachPositionsSelection
                    : PlayerPositionsSelection
                }
                disabled={isPending || selectedRole === UserRole.GUEST}
                {...register('position')}
              />
            </Field>
          ) : (
            <TextField label="Position">
              {user.details.position ? (
                <Badge variant="outline" rounded="full">
                  {user.details.position}
                </Badge>
              ) : (
                <Text>-</Text>
              )}
            </TextField>
          )}
        </Grid>
      </Card.Body>
      <Card.Footer>
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
      </Card.Footer>
    </Card.Root>
  );
}
