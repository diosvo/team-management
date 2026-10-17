'use client';

import { useTransition } from 'react';

import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { CURRENT_DATE, ESTABLISHED_DATE } from '@/utils/constants';

import { submitLeave } from '@/actions/attendance';
import { useSessionContext } from '@/providers/session';
import {
  UpsertAttendanceSchema,
  type UpsertAttendanceSchemaValues,
} from '@/schemas/attendance';

export default function SubmitLeaveRequest({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const t = useTranslations('attendance.leave');
  const { user } = useSessionContext();

  const {
    reset,
    control,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertAttendanceSchema),
    defaultValues: { date: CURRENT_DATE },
  });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: UpsertAttendanceSchemaValues) => {
    if (!user) return;

    const id = toaster.create({
      type: 'loading',
      title: t('loading'),
    });

    startTransition(async () => {
      const { success, message: title } = await submitLeave({
        ...values,
        player_id: user.id,
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
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <Field
                  required
                  label={t('date')}
                  invalid={!!errors.date}
                  errorText={errors.date?.message}
                >
                  <DatePickerField
                    control={control}
                    name="date"
                    min={ESTABLISHED_DATE}
                  />
                </Field>
                <Field
                  label={t('reason')}
                  helperText={t('reasonHelper')}
                  invalid={!!errors.reason}
                  errorText={errors.reason?.message}
                >
                  <Textarea
                    autoresize
                    maxLength={128}
                    placeholder={t('reasonPlaceholder')}
                    {...register('reason')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('submitting')}
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <Send /> {t('submit')}
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
