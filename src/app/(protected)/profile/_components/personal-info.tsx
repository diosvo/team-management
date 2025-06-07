'use client';

import { useMemo, useState, useTransition } from 'react';

import { Card, Grid, HStack, IconButton, Input } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/text-field';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';

import { updatePersonalInfo } from '@/features/user/actions/user';
import {
  EditPersonalInfoSchema,
  EditPersonalInfoValues,
} from '@/features/user/schemas/user';

export default function PersonalInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const canEdit = useMemo(() => !viewOnly, [viewOnly]);

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm({
    values: {
      name: user.name,
      dob: user.dob,
      phone_number: user.phone_number,
      citizen_identification: user.citizen_identification,
    },
    resolver: zodResolver(EditPersonalInfoSchema),
  });

  const onSubmit = (data: EditPersonalInfoValues) => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        description: 'Updating personal information...',
      });

      const { error, message: description } = await updatePersonalInfo(
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
          <Card.Title marginRight="auto">Personal Information</Card.Title>
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
          {isEditing ? (
            <Field label="Email">
              <Input variant="flushed" value={user.email} disabled />
            </Field>
          ) : (
            <TextField label="Email">{user.email}</TextField>
          )}

          {isEditing ? (
            <Field
              required
              label="Fullname"
              invalid={!!errors.name}
              errorText={errors.name?.message}
            >
              <Input
                placeholder="Anonymous"
                disabled={isPending}
                {...register('name')}
              />
            </Field>
          ) : (
            <TextField label="Fullname">{user.name || '-'}</TextField>
          )}

          {isEditing ? (
            <Field
              label="DOB"
              invalid={!!errors.dob}
              errorText={errors.dob?.message}
            >
              <Input
                type="date"
                min="1997-01-01"
                disabled={isPending}
                {...register('dob')}
              />
            </Field>
          ) : (
            <TextField label="DOB">{formatDate(user.dob) || '-'}</TextField>
          )}

          {isEditing ? (
            <Field
              label="Phone Number"
              invalid={!!errors.phone_number}
              errorText={errors.phone_number?.message}
            >
              <Input disabled={isPending} {...register('phone_number')} />
            </Field>
          ) : (
            <TextField label="Phone Number">
              {user.phone_number || '-'}
            </TextField>
          )}

          {isEditing ? (
            <Field
              label="Citizen ID"
              invalid={!!errors.citizen_identification}
              errorText={errors.citizen_identification?.message}
            >
              <Input
                disabled={isPending}
                {...register('citizen_identification')}
              />
            </Field>
          ) : (
            <TextField label="Citizen ID">
              {user.citizen_identification || '-'}
            </TextField>
          )}
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
