'use client';

import { useTransition } from 'react';
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
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { CACHE_KEY } from '@/utils/constant';

import { upsertTeam } from '@/actions/team';
import { UpsertTeamSchema, UpsertTeamSchemaValues } from '@/schemas/team';

export const UpsertTeam = createOverlay(({ action, item, ...rest }) => {
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
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
              <VStack alignItems="stretch" gap={3}>
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
                <Field
                  label="Logo URL"
                  invalid={!!errors.logo_url}
                  errorText={errors.logo_url?.message}
                >
                  <Input
                    placeholder="https://example.com/logo.png"
                    disabled={isPending}
                    {...register('logo_url')}
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
