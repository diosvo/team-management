'use client';

import { useTransition } from 'react';

import {
  Button,
  CloseButton,
  createOverlay,
  Dialog,
  Input,
  Portal,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import LocationSelection from '@/components/common/LocationSelection';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { ESTABLISHED_DATE } from '@/utils/constant';
import { formatDatetime, formatDay } from '@/utils/formatter';

import { upsertSession } from '@/actions/training-session';
import {
  UpsertSessionSchema,
  UpsertSessionSchemaValues,
} from '@/schemas/training';

export const UpsertSession = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    watch,
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertSessionSchema),
    defaultValues: getDefaults(UpsertSessionSchema, item),
  });

  const onSubmit = (data: UpsertSessionSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Creating training session...',
    });

    startTransition(async () => {
      const { success, message } = await upsertSession(item.session_id, data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: message,
      });

      if (success) reset();
      if (action === 'Update') UpsertSession.close('update-session');
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
              <Dialog.Title>{action} Session</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={2} gap={3} mb={4}>
                <Field
                  required
                  label="Date"
                  invalid={!!errors.date}
                  errorText={errors.date?.message}
                >
                  <Input
                    type="date"
                    min={ESTABLISHED_DATE}
                    {...register('date')}
                  />
                </Field>
                <Field disabled readOnly label="Day">
                  <Input variant="flushed" value={formatDay(watch('date'))} />
                </Field>
                <Field
                  required
                  label="Start Time"
                  invalid={!!errors.start_time}
                  errorText={errors.start_time?.message}
                >
                  <Input type="time" {...register('start_time')} />
                </Field>
                <Field
                  required
                  label="End Time"
                  invalid={!!errors.end_time}
                  errorText={errors.end_time?.message}
                >
                  <Input type="time" {...register('end_time')} />
                </Field>
              </SimpleGrid>
              <LocationSelection control={control} isDisabled={isPending} />
            </Dialog.Body>
            <Dialog.Footer justifyContent="space-between">
              <Text fontSize="xs" color="GrayText">
                {item.updated_at &&
                  `Last updated on ${formatDatetime(item.updated_at)}`}
              </Text>
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
