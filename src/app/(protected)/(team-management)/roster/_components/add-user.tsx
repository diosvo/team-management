'use client';

import { RefObject, useTransition } from 'react';

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
  ESTABLISHED_DATE,
  RolesSelection,
  StatesSelection,
} from '@/utils/constant';
import { UserState } from '@/utils/enum';

import { addUser } from '@/features/user/actions/user';
import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';

interface AddUserProps {
  emailExists: Array<string>;
  containerRef: RefObject<Nullable<HTMLDivElement>>;
}

export default function AddUser({ emailExists, containerRef }: AddUserProps) {
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    register,
    getValues,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddUserSchema),
    defaultValues: getDefaults(AddUserSchema) as AddUserValues,
  });

  const onSubmit = (data: AddUserValues) => {
    if (emailExists) {
      setError('email', {
        type: 'custom',
        message: 'Email already exists',
      });
      return;
    }

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
          <HStack width="full" alignItems="flex-start">
            <Field
              required
              label="Roles"
              invalid={!!errors.roles}
              errorText={errors.roles?.message}
            >
              <Select
                multiple
                collection={RolesSelection}
                defaultValue={getValues('roles')}
                containerRef={containerRef}
                disabled={isPending}
                {...register('roles')}
              />
            </Field>
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
                  defaultValue={getValues('join_date')}
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
