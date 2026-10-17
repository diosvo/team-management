'use client';

import { useState, useTransition } from 'react';
import { useSWRConfig } from 'swr';

import {
  Badge,
  HStack,
  IconButton,
  InputGroup,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Activity, Edit, LucideClock9, Save, Shirt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import TextField from '@/components/TextField';
import { Card } from '@/components/ui/card';
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

import { enumLabel } from '@/i18n/enums';
import { CACHE_KEY, ESTABLISHED_DATE } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';
import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';
import { getColor } from '@/utils/helper';

import { updateTeamInfo } from '@/actions/user';
import type { User } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import { EditTeamInfoSchema, type EditTeamInfoValues } from '@/schemas/user';

export default function TeamInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tEnums = useTranslations('enums');
  const locale = useLocale();
  const { isAdmin, isPlayer, isCoach } = usePermissions();

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { mutate } = useSWRConfig();

  const {
    control,
    reset,
    watch,
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
        title: t('team.updating'),
      });

      const { success, message: title } = await updateTeamInfo(user.id, data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) {
        setIsEditing(false);

        if (data.user.state === UserState.ACTIVE) mutate(CACHE_KEY.PLAYERS);
      }
    });
  };

  const onCancel = () => {
    setIsEditing(false);
    reset();
  };

  return (
    <Card
      as="form"
      size="sm"
      onSubmit={handleSubmit(onSubmit)}
      title={t('team.title')}
      action={
        isEditing ? (
          <HStack>
            <CloseButton size="sm" variant="outline" onClick={onCancel} />
            <Tooltip content={tCommon('save')} disabled={isPending}>
              <IconButton
                size="sm"
                type="submit"
                aria-label={tCommon('save')}
                disabled={!isDirty || !isValid || isPending}
              >
                <Save />
              </IconButton>
            </Tooltip>
          </HStack>
        ) : (
          <Tooltip content={viewOnly ? t('viewOnly') : tCommon('edit')}>
            <IconButton
              size="sm"
              variant="subtle"
              disabled={viewOnly}
              aria-label={viewOnly ? t('viewOnly') : tCommon('edit')}
              onClick={() => setIsEditing(true)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
        )
      }
    >
      <Stack gap={3}>
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
            <TextField label={t('team.role')}>
              <Badge variant="outline" borderRadius="full">
                {enumLabel(tEnums, 'userRole', user.role)}
              </Badge>
            </TextField>
            <Visibility isVisible={isPlayer || isCoach}>
              <TextField label={t('team.position')}>
                <Badge variant="outline" borderRadius="full">
                  {isPlayer &&
                    enumLabel(
                      tEnums,
                      'playerPosition',
                      user.player?.position || PlayerPosition.UNKNOWN,
                    )}
                  {isCoach &&
                    enumLabel(
                      tEnums,
                      'coachPosition',
                      user.coach?.position || CoachPosition.UNKNOWN,
                    )}
                </Badge>
              </TextField>
            </Visibility>
          </SimpleGrid>
        )}

        {isEditing && !viewOnly ? (
          <SimpleGrid minChildWidth="12rem" gap={4}>
            <ControlledStateSelection
              control={control}
              name="user.state"
              disabled={isPending}
            />
            <Visibility isVisible={isAdmin || isPlayer}>
              <Field
                label={t('team.jerseyNumber')}
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
            <Field label={t('team.joinDate')}>
              <DatePickerField
                control={control}
                name="user.join_date"
                min={ESTABLISHED_DATE}
                disabled={isPending}
              />
            </Field>
          </SimpleGrid>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2 }}>
              <TextField
                label={t('team.state')}
                direction="horizontal"
                icon={Activity}
              >
                <Badge
                  variant="surface"
                  borderRadius="full"
                  colorPalette={getColor(user.state)}
                >
                  {enumLabel(tEnums, 'userState', user.state)}
                </Badge>
              </TextField>
              <Visibility isVisible={isPlayer}>
                <TextField
                  label={t('team.jerseyNumber')}
                  direction="horizontal"
                  icon={Shirt}
                >
                  {user.player?.jersey_number ?? '-'}
                </TextField>
              </Visibility>
            </SimpleGrid>
            {user.join_date && (
              <TextField
                label={t('team.joinedDate')}
                direction="horizontal"
                icon={LucideClock9}
              >
                <Text>
                  {formatDate(user.join_date)}
                  <Text as="span" fontSize="sm" color="GrayText" marginLeft={1}>
                    (
                    {formatDistanceToNow(user.join_date, {
                      addSuffix: true,
                      locale: locale === 'vi' ? vi : undefined,
                    })}
                    )
                  </Text>
                </Text>
              </TextField>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
