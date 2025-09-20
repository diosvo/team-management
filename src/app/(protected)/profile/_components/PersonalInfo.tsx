'use client';

import { useState, useTransition } from 'react';

import { Card, HStack, IconButton, Input, SimpleGrid } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/text-field';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema/user';
import { getDefaults } from '@/lib/zod';
import { formatDate } from '@/utils/formatter';

import { updatePersonalInfo } from '@/actions/user';
import { EditPersonalInfoSchema, EditPersonalInfoValues } from '@/schemas/user';

export default function PersonalInfo({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const {
    reset,
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
        title: 'Updating personal information...',
      });

      const { error, message: title } = await updatePersonalInfo(user.id, data);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        title,
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
      <Card.Body>
        <SimpleGrid
          columns={{
            base: 1,
            md: 2,
            xl: 3,
          }}
          gap={4}
        >
          {isEditing ? (
            <>
              <Field label="Email">
                <Input variant="flushed" value={user.email} disabled />
              </Field>
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
              <Field
                label="Phone Number"
                invalid={!!errors.phone_number}
                errorText={errors.phone_number?.message}
              >
                <Input disabled={isPending} {...register('phone_number')} />
              </Field>
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
            </>
          ) : (
            <>
              <TextField label="Email">{user.email}</TextField>
              <TextField label="Fullname">{user.name || '-'}</TextField>
              <TextField label="DOB">{formatDate(user.dob) || '-'}</TextField>
              <TextField label="Phone Number">
                {user.phone_number || '-'}
              </TextField>
              <TextField label="Citizen ID">
                {user.citizen_identification || '-'}
              </TextField>
            </>
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
