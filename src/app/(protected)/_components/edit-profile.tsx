'use client';

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
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
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
    reset,
    register,
    getValues,
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
            <HStack width="full">
              <Field label="Fullname">
                <Input disabled={isPending} />
              </Field>
              <Field label="DOB">
                <Input type="date" min="1997-01-01" disabled={isPending} />
              </Field>
            </HStack>
            <HStack width="full">
              <Field label="Phone Number">
                <Input max={10} placeholder="(+84)" disabled={isPending} />
              </Field>
              <Field label="Citizen Identification">
                <Input
                  max={12}
                  placeholder="xxxxxxxxxxxxxxxx"
                  disabled={isPending}
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
            <HStack width="full">
              <Field label="Jersey Number">
                <NumberInput.Root min={0} max={99}>
                  <NumberInput.Control />
                  <NumberInput.Input {...register('jersey_number')} />
                </NumberInput.Root>
              </Field>
              <Field label="Height">
                <NumberInput.Root
                  min={0}
                  max={200}
                  formatOptions={{
                    style: 'unit',
                    unit: 'centimeter',
                    unitDisplay: 'narrow',
                  }}
                >
                  <NumberInput.Control />
                  <NumberInput.Input {...register('height')} />
                </NumberInput.Root>
              </Field>
              <Field label="Weight">
                <NumberInput.Root
                  min={0}
                  max={100}
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
