'use client';

import { useTransition } from 'react';

import {
  Button,
  DialogFooter,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { User } from '@/drizzle/schema';
import { updateProfile } from '@/features/user/actions/user';
import {
  EditProfileSchema,
  EditProfileValues,
} from '@/features/user/schemas/user';

import UserInfo from './user-info';

export default function EditProfile({
  isAdmin,
  user,
}: {
  isAdmin: boolean;
  user: User;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditProfileSchema),
  });

  const backToUserInfo = () => {
    dialog.update('profile', {
      children: <UserInfo user={user} isAdmin={isAdmin} />,
    });
  };

  const onSubmit = (data: EditProfileValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Updating profile...',
    });

    startTransition(async () => {
      const { error, message: description } = await updateProfile(
        user.user_id,
        data
      );

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) backToUserInfo();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader display="flex" alignItems="center">
        <IconButton
          size="xs"
          variant="ghost"
          rounded="full"
          aria-label="Back to user information"
          onClick={backToUserInfo}
        >
          <ArrowLeft />
        </IconButton>
        <DialogTitle>Edit profile</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <VStack align="stretch">
          <VStack gap={4} marginBottom={4}>
            <HStack width="full">
              <Separator flex="1" />
              <Text flexShrink="0" fontSize="sm" color="GrayText">
                Personal
              </Text>
              <Separator flex="1" />
            </HStack>
            <HStack width="full" alignItems="flex-start">
              <Field
                label="Fullname"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  defaultValue={user.name}
                  disabled={isPending}
                  {...register('name')}
                />
              </Field>
              <Field label="DOB">
                <Input
                  type="date"
                  min="1997-01-01"
                  defaultValue={user.dob as string}
                  disabled={isPending}
                  {...register('dob')}
                />
              </Field>
            </HStack>
            <HStack width="full" alignItems="flex-start">
              <Field
                label="Phone Number"
                invalid={!!errors.phone_number}
                errorText={errors.phone_number?.message}
              >
                <Input
                  max={10}
                  disabled={isPending}
                  {...register('phone_number')}
                />
              </Field>
              <Field
                label="Citizen Identification"
                invalid={!!errors.citizen_identification}
                errorText={errors.citizen_identification?.message}
              >
                <Input
                  max={12}
                  disabled={isPending}
                  {...register('citizen_identification')}
                />
              </Field>
            </HStack>
          </VStack>
          <VStack gap={4}>
            <HStack width="full">
              <Separator flex="1" />
              <Text flexShrink="0" fontSize="sm" color="GrayText">
                Team
              </Text>
              <Separator flex="1" />
            </HStack>
            <HStack width="full" alignItems="flex-start">
              <Field
                label="Jersey Number"
                invalid={!!errors.jersey_number}
                errorText={errors.jersey_number?.message}
              >
                <NumberInput.Root
                  min={0}
                  max={99}
                  onValueChange={({ valueAsNumber }) =>
                    setValue('jersey_number', valueAsNumber)
                  }
                >
                  <NumberInput.Control />
                  <NumberInput.Input {...register('jersey_number')} />
                </NumberInput.Root>
              </Field>
              <Field
                label="Height"
                invalid={!!errors.height}
                errorText={errors.height?.message}
              >
                <NumberInput.Root
                  min={0}
                  max={200}
                  onValueChange={({ valueAsNumber }) =>
                    setValue('height', valueAsNumber)
                  }
                  // formatOptions={{
                  //   style: 'unit',
                  //   unit: 'centimeter',
                  //   unitDisplay: 'narrow',
                  // }}
                >
                  <NumberInput.Control />
                  <NumberInput.Input {...register('height')} />
                </NumberInput.Root>
              </Field>
              <Field
                label="Weight"
                invalid={!!errors.weight}
                errorText={errors.weight?.message}
              >
                <NumberInput.Root
                  min={0}
                  max={100}
                  onValueChange={({ valueAsNumber }) =>
                    setValue('weight', valueAsNumber)
                  }
                  formatOptions={{
                    style: 'unit',
                    unit: 'kilogram',
                    unitDisplay: 'narrow',
                  }}
                >
                  <NumberInput.Control />
                  <NumberInput.Input {...register('weight')} />
                </NumberInput.Root>
              </Field>
            </HStack>
          </VStack>
        </VStack>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" loading={isPending} loadingText="Saving...">
          <Save /> Update
        </Button>
      </DialogFooter>
    </form>
  );
}
