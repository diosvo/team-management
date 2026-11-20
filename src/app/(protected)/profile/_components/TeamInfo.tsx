'use client';

import { useMemo, useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  Badge,
  HStack,
  IconButton,
  Input,
  InputGroup,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Save } from 'lucide-react';
import { useSWRConfig } from 'swr';

import { CACHE_KEY, ESTABLISHED_DATE } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';
import { SHORT_FORMS, UserRole, UserState } from '@/utils/enum';
import { getColor } from '@/utils/helper';

import { updateTeamInfo } from '@/actions/user';
import { DatePickerField } from '@/components/date-picker/DatePicker';
import { Card } from '@/components/ui/card';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import JerseySizeSelection from '@/components/user/JerseySizeSelection';
import { RolePositionSelection } from '@/components/user/RolePositionSelection';
import { ControlledStateSelection } from '@/components/user/StateSelection';
import Visibility from '@/components/Visibility';
import type { User } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import { enumFullLabel, enumLabel } from '@/i18n/enums';
import { EditTeamInfoSchema, type EditTeamInfoValues } from '@/schemas/user';

import {
  DetailItem,
  DetailList,
  DetailSection,
  SectionRule,
} from './DetailList';

import { positionLabel } from '../_helpers/position';

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
  const { isAdmin } = usePermissions();

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { mutate } = useSWRConfig();

  const {
    control,
    reset,
    watch,
    setValue,
    register,
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
        jersey_name: user.player?.jersey_name,
        shirt_size: user.player?.shirt_size,
        short_size: user.player?.short_size,
        short_form: user.player?.short_form,
        position: user.player?.position,
      },
      coach: {
        position: user.coach?.position,
      },
    },
    resolver: zodResolver(EditTeamInfoSchema),
  });

  const shortForms = useMemo(
    () =>
      SHORT_FORMS.map((value) => ({
        label: enumLabel(tEnums, 'shortForm', value),
        value,
      })),
    [tEnums],
  );

  const selectedRole = watch('user.role');
  // Read mode follows the profile's own role, never the viewer's. Edit mode
  // follows the picked role, so an admin switching to Player gets the kit.
  const isTargetPlayer = user.role === UserRole.PLAYER;
  // Full name here ("Power Forward"); the header badge keeps "PF".
  const position = positionLabel(tEnums, user, enumFullLabel);
  const { player } = user;
  const jersey = player?.jersey_number;

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
      {isEditing ? (
        <Stack gap={3}>
          {isAdmin && (
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
          )}
          <SimpleGrid minChildWidth="12rem" gap={4}>
            <ControlledStateSelection
              control={control}
              name="user.state"
              disabled={isPending}
            />
            <Field label={t('team.joinDate')}>
              <DatePickerField
                control={control}
                name="user.join_date"
                min={ESTABLISHED_DATE}
                disabled={isPending}
              />
            </Field>
          </SimpleGrid>
          <Visibility isVisible={selectedRole === UserRole.PLAYER}>
            <SectionRule title={t('team.jersey')} />
            <SimpleGrid minChildWidth="12rem" gap={4}>
              <Field
                label={t('team.number')}
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
              <Field
                label={t('team.jerseyName')}
                invalid={!!errors.player?.jersey_name}
                errorText={errors.player?.jersey_name?.message}
              >
                <Input
                  maxLength={20}
                  autoComplete="off"
                  disabled={isPending}
                  {...register('player.jersey_name')}
                />
              </Field>
              <JerseySizeSelection
                control={control}
                name="player.shirt_size"
                label={t('team.shirtSize')}
                disabled={isPending}
              />
              <JerseySizeSelection
                control={control}
                name="player.short_size"
                label={t('team.shortSize')}
                disabled={isPending}
              />
              <JerseySizeSelection
                control={control}
                name="player.short_form"
                label={t('team.shortForm')}
                disabled={isPending}
                options={shortForms}
              />
            </SimpleGrid>
          </Visibility>
        </Stack>
      ) : (
        <Stack gap={4}>
          <DetailList>
            <DetailItem label={t('team.role')}>
              {enumLabel(tEnums, 'userRole', user.role)}
            </DetailItem>
            {position && (
              <DetailItem label={t('team.position')}>{position}</DetailItem>
            )}
            <DetailItem label={t('team.state')}>
              <Badge
                variant="surface"
                borderRadius="full"
                colorPalette={getColor(user.state)}
              >
                {enumLabel(tEnums, 'userState', user.state)}
              </Badge>
            </DetailItem>
            {/* The header already says how long ago; the date is enough here. */}
            <DetailItem label={t('team.joinDate')}>
              {user.join_date && formatDate(user.join_date)}
            </DetailItem>
          </DetailList>
          {isTargetPlayer && (
            <DetailSection title={t('team.jersey')}>
              <DetailItem label={t('team.number')}>
                {typeof jersey === 'number' && `#${jersey}`}
              </DetailItem>
              <DetailItem label={t('team.jerseyName')}>
                {player?.jersey_name}
              </DetailItem>
              <DetailItem label={t('team.shirtSize')}>
                {player?.shirt_size}
              </DetailItem>
              <DetailItem label={t('team.shortSize')}>
                {player?.short_size}
              </DetailItem>
              <DetailItem label={t('team.shortForm')}>
                {player?.short_form &&
                  enumLabel(tEnums, 'shortForm', player.short_form)}
              </DetailItem>
            </DetailSection>
          )}
        </Stack>
      )}
    </Card>
  );
}
