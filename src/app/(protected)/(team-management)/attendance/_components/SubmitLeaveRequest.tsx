'use client';

import { useTransition } from 'react';

import {
  Button,
  CloseButton,
  Dialog,
  Input,
  Portal,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DoorOpen, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import authClient from '@/lib/auth-client';
import { CURRENT_DATE, ESTABLISHED_DATE } from '@/utils/constant';

import { submitLeave } from '@/actions/attendance';
import {
  UpsertAttendanceSchema,
  UpsertAttendanceSchemaValues,
} from '@/schemas/attendance';

export default function SubmitLeaveRequest() {
  const { data } = authClient.useSession();

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertAttendanceSchema),
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: UpsertAttendanceSchemaValues) => {
    if (!data?.user) return;

    const id = toaster.create({
      type: 'loading',
      title: 'Submitting your leave request...',
    });

    startTransition(async () => {
      const { success, message: title } = await submitLeave({
        ...values,
        player_id: data.user.id,
      });

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();

      toaster.remove(id);
    });
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <DoorOpen />
          Submit Leave Request
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Submit Leave Request</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <Field
                  required
                  label="Date"
                  invalid={!!errors.date}
                  errorText={errors.date?.message}
                >
                  <Input
                    type="date"
                    min={ESTABLISHED_DATE}
                    defaultValue={CURRENT_DATE}
                    {...register('date')}
                  />
                </Field>
                <Field
                  label="Reason"
                  helperText="Max 128 characters."
                  invalid={!!errors.reason}
                  errorText={errors.reason?.message}
                >
                  <Textarea
                    autoresize
                    maxLength={128}
                    placeholder="Reason for leave..."
                    {...register('reason')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText="Submitting..."
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <Send /> Submit
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
