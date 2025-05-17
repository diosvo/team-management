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

import { PinInput } from '@/components/ui/pin-input';
import Visibility from '@/components/visibility';
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
      closeOnInteractOutside: true,
    });
  };

  const onSubmit = (data: EditProfileValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Updating profile...',
    });

    // console.log('Edit profile data:', data);

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
          <VStack>
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
            <VStack width="full">
              <Field
                label="Phone Number"
                invalid={!!errors.phone_number}
                errorText={errors.phone_number?.message}
              >
                <PinInput
                  attached
                  size="sm"
                  count={10}
                  disabled={isPending}
                  {...register('phone_number')}
                />
              </Field>
              <Field
                label="Citizen Identification"
                invalid={!!errors.citizen_identification}
                errorText={errors.citizen_identification?.message}
              >
                <PinInput
                  attached
                  size="sm"
                  count={12}
                  disabled={isPending}
                  {...register('citizen_identification')}
                />
              </Field>
            </VStack>
          </VStack>
          <VStack gap={4} marginBlock={4}>
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
                  <NumberInput.Input
                    defaultValue={user.details.jersey_number ?? ''}
                    {...register('jersey_number', { valueAsNumber: true })}
                  />
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
                >
                  <NumberInput.Control />
                  <NumberInput.Input
                    {...register('height', { valueAsNumber: true })}
                  />
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
                >
                  <NumberInput.Control />
                  <NumberInput.Input
                    {...register('weight', { valueAsNumber: true })}
                  />
                </NumberInput.Root>
              </Field>
            </HStack>
          </VStack>
          <Visibility isVisible={isAdmin}>
            <VStack>
              <HStack width="full">
                <Separator flex="1" />
                <Text flexShrink="0" fontSize="sm" color="GrayText">
                  System
                </Text>
                <Separator flex="1" />
              </HStack>
              <HStack width="full"></HStack>
            </VStack>
          </Visibility>
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
