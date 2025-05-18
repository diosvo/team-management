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
import { PinInput } from '@/components/ui/pin-input';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import {
  CoachPositionsSelection,
  PlayerPositionsSelection,
  RolesSelection,
  StatesSelection,
} from '@/utils/constant';
import { UserRole } from '@/utils/enum';

import { updateProfile } from '@/features/user/actions/user';
import {
  EditProfileSchema,
  EditProfileValues,
} from '@/features/user/schemas/user';

import UserInfo, { UserInfoProps } from './user-info';

export default function EditProfile({
  user,
  canEditRole,
  selectionRef,
}: Omit<UserInfoProps, 'isAdmin'>) {
  const { isAdmin, isPlayer } = usePermissions();
  const [isPending, startTransition] = useTransition();

  const {
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditProfileSchema),
  });

  const selectedRole = watch('role');

  const backToUserInfo = () => {
    dialog.update('profile', {
      children: (
        <UserInfo
          isAdmin={isAdmin}
          canEditRole={canEditRole}
          user={user}
          selectionRef={selectionRef}
        />
      ),
      closeOnInteractOutside: true,
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
          <VStack>
            <HStack width="full" alignItems="flex-start">
              <Field
                label="Fullname"
                invalid={!!errors.user?.name}
                errorText={errors.user?.name?.message}
              >
                <Input
                  defaultValue={user.name}
                  disabled={isPending}
                  {...register('user.name')}
                />
              </Field>
              <Field label="DOB">
                <Input
                  type="date"
                  min="1997-01-01"
                  defaultValue={user.dob as string}
                  disabled={isPending}
                  {...register('user.dob')}
                />
              </Field>
              <Visibility isVisible={isAdmin}>
                <Field
                  required
                  label="State"
                  invalid={!!errors.user?.state}
                  errorText={errors.user?.state?.message}
                >
                  <Select
                    collection={StatesSelection}
                    defaultValue={[user.state]}
                    containerRef={selectionRef}
                    disabled={isPending}
                    {...register('user.state')}
                  />
                </Field>
              </Visibility>
            </HStack>
            <VStack width="full">
              <Field
                label="Phone No."
                invalid={!!errors.user?.phone_number}
                errorText={errors.user?.phone_number?.message}
              >
                <PinInput
                  attached
                  size="sm"
                  count={10}
                  disabled={isPending}
                  {...register('user.phone_number')}
                />
              </Field>
              <Field
                label="Citizen Identification"
                invalid={!!errors.user?.citizen_identification}
                errorText={errors.user?.citizen_identification?.message}
              >
                <PinInput
                  attached
                  size="sm"
                  count={12}
                  disabled={isPending}
                  {...register('user.citizen_identification')}
                />
              </Field>
            </VStack>
          </VStack>
          <Visibility isVisible={isAdmin || isPlayer}>
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
                  label="Jersey No."
                  invalid={!!errors.player?.jersey_number}
                  errorText={errors.player?.jersey_number?.message}
                >
                  <NumberInput.Root
                    min={0}
                    max={99}
                    onValueChange={({ valueAsNumber }) =>
                      setValue('player.jersey_number', valueAsNumber)
                    }
                  >
                    <NumberInput.Control />
                    <NumberInput.Input
                      defaultValue={user.details.jersey_number ?? ''}
                      {...register('player.jersey_number', {
                        valueAsNumber: true,
                      })}
                    />
                  </NumberInput.Root>
                </Field>
                <Field
                  label="Height"
                  invalid={!!errors.player?.height}
                  errorText={errors.player?.height?.message}
                >
                  <NumberInput.Root
                    min={0}
                    max={200}
                    onValueChange={({ valueAsNumber }) =>
                      setValue('player.height', valueAsNumber)
                    }
                  >
                    <NumberInput.Control />
                    <NumberInput.Input
                      {...register('player.height', { valueAsNumber: true })}
                    />
                  </NumberInput.Root>
                </Field>
                <Field
                  label="Weight"
                  invalid={!!errors.player?.weight}
                  errorText={errors.player?.message}
                >
                  <NumberInput.Root
                    min={0}
                    max={100}
                    onValueChange={({ valueAsNumber }) =>
                      setValue('player.weight', valueAsNumber)
                    }
                  >
                    <NumberInput.Control />
                    <NumberInput.Input
                      {...register('player.weight', { valueAsNumber: true })}
                    />
                  </NumberInput.Root>
                </Field>
              </HStack>
            </VStack>
          </Visibility>
          <Visibility isVisible={canEditRole}>
            <VStack>
              <HStack width="full">
                <Separator flex="1" />
                <Text flexShrink="0" fontSize="sm" color="GrayText">
                  System
                </Text>
                <Separator flex="1" />
              </HStack>
              <HStack width="full">
                <Field
                  required
                  label="Role"
                  invalid={!!errors.role}
                  errorText={errors.role?.message}
                >
                  <Select
                    collection={RolesSelection}
                    defaultValue={[user.role]}
                    containerRef={selectionRef}
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
                    containerRef={selectionRef}
                    defaultValue={
                      user.details.position
                        ? [user.details.position]
                        : undefined
                    }
                    disabled={selectedRole === UserRole.GUEST || isPending}
                    {...register('position')}
                  />
                </Field>
              </HStack>
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
