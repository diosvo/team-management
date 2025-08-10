'use client';

import { useRef, useTransition } from 'react';

import { Button, Dialog, Input, Portal, SimpleGrid } from '@chakra-ui/react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    mode: 'onChange',
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
          <Dialog.Content ref={contentRef}>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Add to Roster</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field
                  required
                  label="Fullname"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    autoComplete="name"
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  required
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <Input
                    type="email"
                    autoComplete="email"
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
              </SimpleGrid>
              <SimpleGrid
                columns={{ base: 1, md: 2 }}
                templateColumns={{ md: '3fr 6.25fr' }}
                gap={4}
                marginTop={4}
              >
                <StateSelection
                  name="state"
                  control={control}
                  disabled={isPending}
                  contentRef={contentRef}
                />
                <RolePositionSelection
                  roleName="role"
                  positionName="position"
                  control={control}
                  disabled={isPending}
                  contentRef={contentRef}
                  setValue={setValue}
                />
              </SimpleGrid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText="Adding..."
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <Plus /> Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
