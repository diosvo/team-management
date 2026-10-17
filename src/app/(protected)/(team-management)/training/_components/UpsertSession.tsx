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
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import LocationSelection from '@/components/common/LocationSelection';
import { DatePickerField } from '@/components/date-picker/DatePicker';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { ESTABLISHED_DATE } from '@/utils/constants';
import { formatDatetime, formatDay } from '@/utils/datetime';

import { upsertSession } from '@/actions/training-session';
import {
  UpsertSessionSchema,
  type UpsertSessionSchemaValues,
} from '@/schemas/training';

export const UpsertSession = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('training.upsertSession');
  const tc = useTranslations('common');
  const locale = useLocale();
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
      title: t('creating'),
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
              <Dialog.Title>
                {action === 'Update' ? t('updateTitle') : t('createTitle')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} mb={4}>
                <Field
                  required
                  label={tc('date')}
                  invalid={!!errors.date}
                  errorText={errors.date?.message}
                >
                  <DatePickerField
                    control={control}
                    name="date"
                    min={ESTABLISHED_DATE}
                  />
                </Field>
                <Field disabled readOnly label={t('day')}>
                  <Input
                    variant="flushed"
                    value={formatDay(watch('date'), undefined, locale)}
                  />
                </Field>
                <Field
                  required
                  label={t('startTime')}
                  invalid={!!errors.start_time}
                  errorText={errors.start_time?.message}
                >
                  <Input type="time" {...register('start_time')} />
                </Field>
                <Field
                  required
                  label={t('endTime')}
                  invalid={!!errors.end_time}
                  errorText={errors.end_time?.message}
                >
                  <Input type="time" {...register('end_time')} />
                </Field>
              </SimpleGrid>
              <LocationSelection control={control} isDisabled={isPending} />
            </Dialog.Body>
            <Dialog.Footer
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Text textStyle="caption" color="GrayText">
                {item.updated_at &&
                  t('lastUpdated', { date: formatDatetime(item.updated_at) })}
              </Text>
              <Button
                type="submit"
                loadingText={t('savingButton')}
                loading={isPending}
                disabled={!isValid}
              >
                <Save /> {action === 'Update' ? tc('update') : tc('create')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
