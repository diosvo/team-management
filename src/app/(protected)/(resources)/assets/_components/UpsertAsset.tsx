'use client';

import dynamic from 'next/dynamic';
import { useTransition } from 'react';

import {
  Button,
  Dialog,
  Input,
  Portal,
  SimpleGrid,
  Skeleton,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import { CloseButton } from '@/components/ui/close-button';
import RadioGroupField from '@/components/RadioGroupField';
import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import { OnePlayerSelection } from '@/components/user/PlayerSelection';

import { useSelection } from '@/i18n/enums';
import { getDefaults, onError } from '@/lib/zod';
import {
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
  CURRENT_DATE,
  ESTABLISHED_DATE,
} from '@/utils/constants';
import { AssetCondition } from '@/utils/enum';

import { upsertAsset } from '@/actions/asset';
import {
  NOTE_LIMIT,
  UpsertAssetSchema,
  type UpsertAssetSchemaValues,
} from '@/schemas/asset';

const RichTextInput = dynamic(
  () => import('@/components/editor/RichTextInput'),
  {
    ssr: false,
    loading: () => <Skeleton height={200} />,
  },
);

export const UpsertAsset = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('assets.upsert');
  const tCommon = useTranslations('common');
  const categoryOptions = useSelection(
    ASSET_CATEGORY_SELECTION,
    'assetCategory',
  );
  const conditionOptions = useSelection(
    ASSET_CONDITION_SELECTION,
    'assetCondition',
  );
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm({
    resolver: zodResolver(UpsertAssetSchema),
    defaultValues: getDefaults(UpsertAssetSchema, item),
  });

  const onSubmit = (data: UpsertAssetSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('savingToast'),
    });

    startTransition(async () => {
      const { success, message: title } = await upsertAsset(
        item.asset_id,
        data,
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) {
        if (action === 'Add') reset();
        if (action === 'Update') UpsertAsset.close('update-asset');
      }
    });
  };

  return (
    <Dialog.Root size={{ base: 'xs', md: 'md' }} {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit, onError)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>
                {action === 'Add' ? t('addTitle') : t('updateTitle')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field
                  required
                  label={t('name')}
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder={t('namePlaceholder')}
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  required
                  label={t('quantity')}
                  invalid={!!errors.quantity}
                  errorText={errors.quantity?.message}
                >
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <NumberInputRoot
                        width="full"
                        disabled={field.disabled}
                        name={field.name}
                        value={String(field.value)}
                        onValueChange={({ value }) => field.onChange(value)}
                      >
                        <NumberInputField onBlur={field.onBlur} />
                      </NumberInputRoot>
                    )}
                  />
                </Field>
                <Field label={t('acquiredDate')}>
                  <DatePickerField
                    control={control}
                    name="acquired_date"
                    min={ESTABLISHED_DATE}
                    max={CURRENT_DATE}
                  />
                </Field>
                <OnePlayerSelection
                  control={control}
                  name="assigned_to"
                  label="owner"
                />
              </SimpleGrid>
              <RadioGroupField
                control={control}
                name="category"
                legend={t('category')}
                options={categoryOptions}
                colorPalette="red"
                marginBlock={4}
              />
              <RadioGroupField
                control={control}
                name="condition"
                legend={t('condition')}
                options={conditionOptions}
                colorPalette="green"
                isHidden={({ value }) =>
                  action === 'Add' && value === AssetCondition.OBSOLETE
                }
              />
              <Field
                label={t('note')}
                invalid={!!errors.note}
                errorText={errors.note?.message}
                marginTop={4}
              >
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <RichTextInput
                      width="full"
                      toolbar="inline"
                      limit={NOTE_LIMIT}
                      disabled={field.disabled || isPending}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </Field>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('saving')}
                loading={isPending}
                disabled={!isDirty || isPending}
              >
                <Save /> {action === 'Add' ? tCommon('add') : tCommon('update')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
