'use client';

import { Button, createOverlay, Dialog, Input, Portal } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import RadioGroupField from '@/components/RadioGroupField';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { useSelection } from '@/i18n/enums';
import { getDefaults } from '@/lib/zod';
import { TEST_TYPE_UNIT_SELECTION } from '@/utils/constants';

import { upsertTestType } from '@/actions/test-type';
import {
  UpsertTestTypeSchema,
  type UpsertTestTypeSchemaValues,
} from '@/schemas/periodic-testing';

export const UpsertTestType = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('periodicTesting.upsertTestType');
  const tCommon = useTranslations('common');
  const unitOptions = useSelection(TEST_TYPE_UNIT_SELECTION, 'testTypeUnit');
  const isUpdate = action === 'Update';
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(UpsertTestTypeSchema),
    defaultValues: getDefaults(UpsertTestTypeSchema, item),
  });

  const onSubmit = (data: UpsertTestTypeSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('saving'),
    });

    startTransition(async () => {
      const { success, message: title } = await upsertTestType(
        item.type_id as string,
        data,
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
      if (isUpdate) UpsertTestType.close('update-test-type');
    });
  };

  return (
    <Dialog.Root size="sm" {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>
                {isUpdate ? t('updateTitle') : t('addTitle')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body paddingTop={0}>
              <Field
                required
                label={tCommon('name')}
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input {...register('name')} disabled={isPending} />
              </Field>
              <RadioGroupField
                control={control}
                name="unit"
                legend={t('unit')}
                options={unitOptions}
                colorPalette="red"
                columns={{ base: 1, md: 3 }}
                marginTop={3}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('saving')}
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <Save /> {isUpdate ? tCommon('update') : tCommon('add')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
