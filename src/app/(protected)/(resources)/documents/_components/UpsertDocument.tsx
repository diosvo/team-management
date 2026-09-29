'use client';

import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  Button,
  createOverlay,
  Dialog,
  Fieldset,
  HStack,
  Input,
  Portal,
  SimpleGrid,
  Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';

import {
  CURRENT_DATE,
  DOCUMENT_TYPE_SELECTION,
  ESTABLISHED_DATE,
} from '@/utils/constants';
import { detectDocumentType, isDriveUrl } from '@/utils/drive';

import { getDefaults, onError } from '@/lib/zod';

import { upsertDocument } from '@/actions/document';
import { DatePickerField } from '@/components/date-picker/DatePicker';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Radio, RadioGroup } from '@/components/ui/radio';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { useSelection } from '@/i18n/enums';
import {
  NOTE_LIMIT,
  UpsertDocumentSchema,
  type UpsertDocumentSchemaValues,
} from '@/schemas/document';

export const UpsertDocument = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('documents.upsert');
  const tCommon = useTranslations('common');
  const typeOptions = useSelection(DOCUMENT_TYPE_SELECTION, 'documentType');
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { isValid, isDirty, errors },
  } = useForm({
    resolver: zodResolver(UpsertDocumentSchema),
    defaultValues: getDefaults(UpsertDocumentSchema, item),
  });

  const onSubmit = (data: UpsertDocumentSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('savingToast'),
    });

    startTransition(async () => {
      const { success, message: title } = await upsertDocument(
        item.document_id,
        data,
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) {
        if (action === 'Add') reset();
        if (action === 'Update') UpsertDocument.close('update-document');
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
              <Field
                required
                label={t('title')}
                invalid={!!errors.title}
                errorText={errors.title?.message}
              >
                <Input
                  placeholder={t('titlePlaceholder')}
                  disabled={isPending}
                  {...register('title')}
                />
              </Field>
              <Field
                required
                label={t('link')}
                marginTop={4}
                invalid={!!errors.url}
                errorText={errors.url?.message}
                helperText={t('linkHelper')}
              >
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  disabled={isPending}
                  {...register('url', {
                    // Pre-select the type from the link shape; still editable.
                    onChange: (event) => {
                      const url = event.target.value;
                      if (isDriveUrl(url)) {
                        setValue('type', detectDocumentType(url), {
                          shouldDirty: true,
                        });
                      }
                    },
                  })}
                />
              </Field>
              <Fieldset.Root marginBlock={4}>
                <Fieldset.Legend color="GrayText">{t('type')}</Fieldset.Legend>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      size="sm"
                      colorPalette="blue"
                      marginTop={2}
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => field.onChange(value)}
                    >
                      <HStack gap={4} flexWrap="wrap">
                        {typeOptions.map((option) => (
                          <Tooltip
                            key={option.value}
                            content={option.description}
                          >
                            <Radio value={option.value} onBlur={field.onBlur}>
                              {option.label}
                            </Radio>
                          </Tooltip>
                        ))}
                      </HStack>
                    </RadioGroup>
                  )}
                />
              </Fieldset.Root>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field label={t('eventDate')}>
                  <DatePickerField
                    control={control}
                    name="event_date"
                    min={ESTABLISHED_DATE}
                    max={CURRENT_DATE}
                    disabled={isPending}
                  />
                </Field>
              </SimpleGrid>
              <Field
                label={t('note')}
                helperText={t('noteHelper', { max: NOTE_LIMIT })}
                marginTop={4}
              >
                <Textarea
                  autoresize
                  maxLength={NOTE_LIMIT}
                  placeholder={t('notePlaceholder')}
                  disabled={isPending}
                  {...register('note')}
                />
              </Field>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('saving')}
                loading={isPending}
                disabled={!isValid || !isDirty || isPending}
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
