'use client';

import { RefObject, useEffect, useTransition } from 'react';

import {
  Button,
  HStack,
  Input,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import {
  CoachPositionsSelection,
  ESTABLISHED_DATE,
  PlayerPositionsSelection,
  RoleSelection,
  StatesSelection,
} from '@/utils/constant';
import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';

import { addUser } from '@/features/user/actions/user';
import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';

export default function AddUser({
  containerRef,
}: {
  containerRef: RefObject<Nullable<HTMLDivElement>>;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddUserSchema),
    defaultValues: getDefaults(AddUserSchema) as AddUserValues,
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (selectedRole === UserRole.GUEST) {
      setValue('position', undefined);
    } else if (selectedRole === UserRole.COACH) {
      setValue('position', CoachPosition.UNKNOWN);
    } else if (selectedRole === UserRole.PLAYER) {
      setValue('position', PlayerPosition.UNKNOWN);
    }
  }, [selectedRole, setValue]);

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

      if (!error) {
        reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>Add to Roster</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <VStack gap={4}>
          <HStack width="full" alignItems="flex-start">
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
          </HStack>
          <HStack width="full">
            <Field
              required
              label="State"
              invalid={!!errors.state}
              errorText={errors.state?.message}
            >
              <Select
                collection={StatesSelection}
                defaultValue={[UserState.ACTIVE]}
                containerRef={containerRef}
                disabled={isPending}
                {...register('state')}
              />
            </Field>
            <Field
              required
              label="Role"
              invalid={!!errors.role}
              errorText={errors.role?.message}
            >
              <Select
                collection={RoleSelection}
                defaultValue={[UserRole.PLAYER]}
                containerRef={containerRef}
                disabled={isPending}
                {...register('role')}
              />
            </Field>
            <Field
              label="Position"
              invalid={!!errors.position}
              errorText={errors.position?.message}
              disabled={selectedRole === UserRole.GUEST}
            >
              <Select
                collection={
                  selectedRole === UserRole.COACH
                    ? CoachPositionsSelection
                    : PlayerPositionsSelection
                }
                defaultValue={['UNKNOWN']}
                containerRef={containerRef}
                disabled={isPending || selectedRole === UserRole.GUEST}
                {...register('position')}
              />
            </Field>
          </HStack>

          <VStack width="full">
            <HStack width="full" marginBottom={2}>
              <Separator flex="1" />
              <Text flexShrink="0" fontSize="sm" color="GrayText">
                Optional
              </Text>
              <Separator flex="1" />
            </HStack>
            <HStack width="full">
              <Field label="DOB">
                <Input
                  type="date"
                  min="1997-01-01"
                  defaultValue="2000-01-01"
                  disabled={isPending}
                  {...register('dob')}
                />
              </Field>
              <Field label="Join Date">
                <Input
                  type="date"
                  min={ESTABLISHED_DATE}
                  defaultValue={ESTABLISHED_DATE}
                  disabled={isPending}
                  {...register('join_date')}
                />
              </Field>
            </HStack>
          </VStack>
        </VStack>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" loading={isPending} loadingText="Adding...">
          <Plus /> Add
        </Button>
      </DialogFooter>
    </form>
  );
}
