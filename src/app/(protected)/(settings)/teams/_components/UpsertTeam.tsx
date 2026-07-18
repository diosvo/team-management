'use client';

import { useState, useTransition } from 'react';
import { useSWRConfig } from 'swr';

import {
  Button,
  Dialog,
  Input,
  Portal,
  VStack,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageOff, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { UpsertTeamSchema, type UpsertTeamSchemaValues } from '@/schemas/team';
import { CACHE_KEY } from '@/utils/constant';

import { uploadLogo, upsertTeam } from '@/actions/team';
import ImageUploader from '@/components/common/ImageUploader';
import { useTeamLogo } from '@/hooks/use-image';

export const UpsertTeam = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();
  const [imagePath, setImagePath] = useState(item.image);

  const { mutate } = useSWRConfig();
  const { data: image, isLoading } = useTeamLogo(imagePath);

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, isDirty, errors },
  } = useForm({
    resolver: zodResolver(UpsertTeamSchema),
    defaultValues: getDefaults(UpsertTeamSchema, item),
  });

  const onSubmit = (data: UpsertTeamSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving team information...',
    });

    startTransition(async () => {
      const { success, message: title } = await upsertTeam(item.team_id, data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) {
        reset();
        mutate(CACHE_KEY.OPPONENTS, undefined, { revalidate: true });
      }
      if (action === 'Update') UpsertTeam.close('update-team');
    });
  };

  const handleFileChange = (file: File) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Setting team logo...',
    });

    startTransition(async () => {
      const {
        success,
        message: title,
        data,
      } = await uploadLogo(item.team_id, imagePath, file);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success && data) {
        setImagePath(data.image);
      }
    });
  };

  return (
    <Dialog.Root {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{action} Team</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <ImageUploader
                  src={image as string}
                  fallback={item.name || <ImageOff />}
                  state={isPending || isLoading ? 'pending' : 'editable'}
                  onChange={handleFileChange}
                />
                <Field
                  required
                  label="Name"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder="Basketball Club"
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <Input
                    type="email"
                    placeholder="contact@gg.com"
                    disabled={isPending}
                    {...register('email')}
                  />
                </Field>
                <Field
                  label="Establish Year"
                  invalid={!!errors.establish_year}
                  errorText={errors.establish_year?.message}
                >
                  <Input
                    type="number"
                    min={2000}
                    max={new Date().getFullYear()}
                    disabled={isPending}
                    {...register('establish_year')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText="Saving..."
                loading={isPending}
                disabled={!isValid || !isDirty || isPending}
              >
                <Save /> {action}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
