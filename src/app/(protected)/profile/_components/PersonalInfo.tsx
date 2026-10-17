'use client';

import { useState, useTransition } from 'react';

import { HStack, IconButton, Input, SimpleGrid } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import TextField from '@/components/TextField';
import { Card } from '@/components/ui/card';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import type { User } from '@/drizzle/schema/user';
import { getDefaults } from '@/lib/zod';
import { formatDate } from '@/utils/datetime';

import { updatePersonalInfo } from '@/actions/user';
import {
  EditPersonalInfoSchema,
  type EditPersonalInfoValues,
} from '@/schemas/user';

export default function PersonalInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
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
      <SimpleGrid minChildWidth="12rem" gap={4}>
        {isEditing ? (
          <>
            <Field label={tCommon('email')}>
              <Input variant="flushed" value={user.email} disabled />
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
          </>
        ) : (
          <>
            <TextField label={tCommon('email')}>{user.email}</TextField>
            <TextField label={t('personal.fullname')}>
              {user.name || '-'}
            </TextField>
            <TextField label={t('personal.dob')}>
              {formatDate(user.dob) || '-'}
            </TextField>
            <TextField label={t('personal.phoneNumber')}>
              {user.phone_number || '-'}
            </TextField>
            <TextField label={t('personal.citizenId')}>
              {user.citizen_identification || '-'}
            </TextField>
          </>
        )}
      </SimpleGrid>
    </Card>
  );
}
