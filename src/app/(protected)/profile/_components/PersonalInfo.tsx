'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  HStack,
  IconButton,
  Input,
  Link,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInYears } from 'date-fns';
import { Edit, Eye, EyeOff, Save } from 'lucide-react';

import { formatDate } from '@/utils/datetime';
import { visibleEmail } from '@/utils/email';
import { maskId } from '@/utils/formatter';

import { getDefaults } from '@/lib/zod';

import { updatePersonalInfo } from '@/actions/user';
import { DatePickerField } from '@/components/date-picker/DatePicker';
import { Card } from '@/components/ui/card';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import type { User } from '@/drizzle/schema/user';
import usePermissions from '@/hooks/use-permissions';
import {
  EditPersonalInfoSchema,
  type EditPersonalInfoValues,
} from '@/schemas/user';

import { DetailItem, DetailList } from './DetailList';

/**
 * The citizen ID masked to its last 4 digits, with an eye toggle for admins
 * and captains. `getUserProfile` sends the full number only to them and the
 * member; everyone else receives it already masked.
 */
function CitizenId({ value }: { value: string }) {
  const t = useTranslations('profile.personal');
  const { isAdmin, isCaptain } = usePermissions();
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const label = isRevealed ? t('hideCitizenId') : t('showCitizenId');

  return (
    <HStack gap={1}>
      <Text as="span" fontVariantNumeric="tabular-nums">
        {isRevealed ? value : maskId(value)}
      </Text>
      {(isAdmin || isCaptain) && (
        <Tooltip content={label}>
          <IconButton
            // The card is a form: never submit it.
            type="button"
            size="2xs"
            variant="ghost"
            aria-label={label}
            onClick={() => setIsRevealed((revealed) => !revealed)}
          >
            {isRevealed ? <EyeOff /> : <Eye />}
          </IconButton>
        </Tooltip>
      )}
    </HStack>
  );
}

export default function PersonalInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  // A placeholder address is shown as "No email"
  const email = visibleEmail(user.email);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const {
    reset,
    control,
    register,
    handleSubmit,
    formState: { isValid, isDirty, errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(EditPersonalInfoSchema),
    defaultValues: getDefaults(EditPersonalInfoSchema, user),
  });

  const onSubmit = (data: EditPersonalInfoValues) => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        title: t('personal.updating'),
      });

      const { success, message: title } = await updatePersonalInfo(
        user.id,
        data,
      );

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
    <Card
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      title={t('personal.title')}
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
        <SimpleGrid minChildWidth="12rem" gap={4}>
          <Field label={tCommon('email')}>
            <Input
              variant="flushed"
              value={email ?? tCommon('noEmail')}
              disabled
            />
          </Field>
          <Field
            required
            label={t('personal.fullname')}
            invalid={!!errors.name}
            errorText={errors.name?.message}
          >
            <Input
              placeholder={t('personal.namePlaceholder')}
              disabled={isPending}
              {...register('name')}
            />
          </Field>
          <Field
            label={t('personal.dob')}
            invalid={!!errors.dob}
            errorText={errors.dob?.message}
          >
            <DatePickerField
              control={control}
              name="dob"
              min="1997-01-01"
              presets={false}
              disabled={isPending}
            />
          </Field>
          <Field
            label={t('personal.phoneNumber')}
            invalid={!!errors.phone_number}
            errorText={errors.phone_number?.message}
          >
            <Input disabled={isPending} {...register('phone_number')} />
          </Field>
          <Field
            label={t('personal.citizenId')}
            invalid={!!errors.citizen_identification}
            errorText={errors.citizen_identification?.message}
          >
            <Input
              disabled={isPending}
              {...register('citizen_identification')}
            />
          </Field>
        </SimpleGrid>
      ) : (
        <DetailList>
          <DetailItem label={tCommon('email')}>
            {email ? (
              <Link href={`mailto:${email}`} colorPalette="blue">
                {email}
              </Link>
            ) : (
              <Text color="fg.muted">{tCommon('noEmail')}</Text>
            )}
          </DetailItem>
          <DetailItem label={t('personal.phoneNumber')}>
            {user.phone_number && (
              <Link href={`tel:${user.phone_number}`} colorPalette="blue">
                {user.phone_number}
              </Link>
            )}
          </DetailItem>
          <DetailItem label={t('personal.dob')}>
            {user.dob &&
              `${formatDate(user.dob)} · ${t('personal.age', {
                age: differenceInYears(new Date(), user.dob),
              })}`}
          </DetailItem>
          <DetailItem label={t('personal.citizenId')}>
            {user.citizen_identification && (
              <CitizenId value={user.citizen_identification} />
            )}
          </DetailItem>
        </DetailList>
      )}
    </Card>
  );
}
