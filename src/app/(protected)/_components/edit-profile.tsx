'use client';

import { useTransition } from 'react';

import {
  Badge,
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
  StatesSelection,
} from '@/utils/constant';
import { UserRole, UserState } from '@/utils/enum';

import { updateProfile } from '@/features/user/actions/user';
import {
  EditProfileSchema,
  EditProfileValues,
} from '@/features/user/schemas/user';

import UserInfo, { UserInfoProps } from './user-info';

export default function EditProfile({
  user,
  canEdit,
  selectionRef,
}: Omit<UserInfoProps, 'isAdmin'>) {
  const { isAdmin, isPlayer } = usePermissions();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditProfileSchema),
  });

  const backToUserInfo = () => {
    dialog.update('profile', {
      children: (
        <UserInfo
          isAdmin={isAdmin}
          canEdit={canEdit}
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
        user.role,
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
                required
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
            </HStack>
            <Visibility isVisible={canEdit}>
              <HStack width="full" alignItems="flex-start">
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
                <Field
                  label="Position"
                  invalid={!!errors.position}
                  errorText={errors.position?.message}
                >
                  <Select
                    collection={
                      user.role === UserRole.COACH
                        ? CoachPositionsSelection
                        : PlayerPositionsSelection
                    }
                    containerRef={selectionRef}
                    defaultValue={
                      user.details.position
                        ? [user.details.position]
                        : [UserState.UNKNOWN]
                    }
                    disabled={isPending}
                    {...register('position')}
                  />
                </Field>
              </HStack>
            </Visibility>
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
          <Visibility isVisible={isPlayer || canEdit}>
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
                  <NumberInput.Root min={0} max={99}>
                    <NumberInput.Control />
                    <NumberInput.Input
                      defaultValue={user.details.jersey_number || ''}
                      {...register('player.jersey_number')}
                    />
                  </NumberInput.Root>
                </Field>
                <Field
                  label="Height"
                  optionalText={
                    <Badge size="xs" variant="surface">
                      cm
                    </Badge>
                  }
                  invalid={!!errors.player?.height}
                  errorText={errors.player?.height?.message}
                >
                  <NumberInput.Root min={0} max={200}>
                    <NumberInput.Control />
                    <NumberInput.Input {...register('player.height')} />
                  </NumberInput.Root>
                </Field>
                <Field
                  label="Weight"
                  optionalText={
                    <Badge size="xs" variant="surface">
                      kg
                    </Badge>
                  }
                  invalid={!!errors.player?.weight}
                  errorText={errors.player?.message}
                >
                  <NumberInput.Root min={0} max={100}>
                    <NumberInput.Control />
                    <NumberInput.Input {...register('player.weight')} />
                  </NumberInput.Root>
                </Field>
              </HStack>
            </VStack>
          </Visibility>
        </VStack>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" loading={isPending} loadingText="Updating...">
          <Save /> Update
        </Button>
      </DialogFooter>
    </form>
  );
}
