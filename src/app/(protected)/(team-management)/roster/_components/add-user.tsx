'use client';

import { useTransition } from 'react';

import { Button, Dialog, Grid, Input, Portal } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserRoundPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import RolePositionSelection from '@/components/user/role-position-selection';
import StateSelection from '@/components/user/state-selection';

import { getDefaults } from '@/lib/zod';

import { addUser } from '@/features/user/actions/user';
import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';

export default function AddUser() {
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddUserSchema),
    defaultValues: getDefaults(AddUserSchema),
  });

  const onSubmit = (data: AddUserValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Adding user to database...',
    });

    startTransition(async () => {
      const { error, message: description } = await addUser(data);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) reset();
    });
  };

  return (
    <Dialog.Root size="lg" lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <UserRoundPlus />
          Add
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Add to Roster</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(3, 1fr)',
                }}
                gap={4}
              >
                <Field
                  required
                  label="Fullname"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input {...register('name')} disabled={isPending} />
                </Field>
                <Field
                  required
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <Input
                    type="email"
                    placeholder="abc@gmail.com"
                    disabled={isPending}
                    {...register('email')}
                  />
                </Field>
                <Field label="DOB">
                  <Input
                    type="date"
                    min="1997-01-01"
                    disabled={isPending}
                    {...register('dob')}
                  />
                </Field>

                <StateSelection
                  name="state"
                  control={control}
                  disabled={isPending}
                />
                <RolePositionSelection
                  roleName="role"
                  positionName="position"
                  control={control}
                  disabled={isPending}
                />
              </Grid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} loadingText="Adding...">
                <Plus /> Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
