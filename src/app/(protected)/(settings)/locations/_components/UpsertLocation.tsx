'use client';

import { useTransition } from 'react';

import {
  Button,
  Dialog,
  Input,
  Portal,
  VStack,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { upsertLocation } from '@/actions/location';
import { getDefaults } from '@/lib/zod';
import {
  UpsertLocationSchema,
  UpsertLocationSchemaValues,
} from '@/schemas/location';

export const UpsertLocation = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertLocationSchema),
    defaultValues: getDefaults(UpsertLocationSchema, item),
  });

  const onSubmit = (data: UpsertLocationSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving location information...',
    });

    startTransition(async () => {
      const { success, message: title } = await upsertLocation(
        item.location_id,
        data,
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
      if (action === 'Update') UpsertLocation.close('update-location');
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
              <Dialog.Title>{action} Location</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={3}>
                <Field
                  required
                  label="Name"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder="Headquarters"
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  required
                  label="Address"
                  invalid={!!errors.address}
                  errorText={errors.address?.message}
                >
                  <Input
                    placeholder="123 Main St, City, Country"
                    disabled={isPending}
                    {...register('address')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText="Saving..."
                loading={isPending}
                disabled={!isValid}
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
