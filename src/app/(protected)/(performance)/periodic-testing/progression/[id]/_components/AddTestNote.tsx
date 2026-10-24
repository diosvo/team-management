'use client';

import { useMemo, useTransition } from 'react';

import {
  Button,
  createListCollection,
  createOverlay,
  Dialog,
  Input,
  Portal,
  Select,
  Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { unitLabel } from '@/utils/progression';

import { saveTestNote } from '@/actions/progression';
import type { TestType } from '@/drizzle/schema';
import {
  TestNoteSchema,
  type TestNoteSchemaValues,
} from '@/schemas/periodic-testing';
import type { TestNoteItem } from '@/types/periodic-testing';

// Select items need a non-empty value; the form keeps '' for a general note.
const GENERAL = 'general';

type AddTestNoteProps = {
  playerId: string;
  types: Array<TestType>;
  // Focus areas that already have a note: one note per test type.
  usedTypeIds?: Array<string>;
  // Set to edit this note instead of adding one.
  note?: TestNoteItem;
};

export const AddTestNote = createOverlay<AddTestNoteProps>(
  ({ playerId, types, usedTypeIds = [], note, ...rest }) => {
    const t = useTranslations(
      'periodicTesting.playerProgression.addNoteDialog',
    );
    const tCommon = useTranslations('common');
    const [isPending, startTransition] = useTransition();

    const {
      control,
      reset,
      watch,
      register,
      handleSubmit,
      formState: { isValid, errors },
    } = useForm({
      mode: 'onChange',
      resolver: zodResolver(TestNoteSchema),
      defaultValues: getDefaults(
        TestNoteSchema,
        note
          ? {
              type_id: note.type_id ?? '',
              content: note.content,
              goal: note.goal == null ? '' : String(note.goal),
            }
          : undefined,
      ),
    });

    const focusAreas = useMemo(
      () =>
        createListCollection({
          items: [
            { label: t('general'), value: GENERAL },
            // A note's own focus area stays pickable while editing it.
            ...types
              .filter(
                ({ type_id }) =>
                  type_id === note?.type_id || !usedTypeIds.includes(type_id),
              )
              .map(({ type_id, name }) => ({
                label: name,
                value: type_id,
              })),
          ],
        }),
      [types, usedTypeIds, note?.type_id, t],
    );

    const typeId = watch('type_id');
    const unit = types.find(({ type_id }) => type_id === typeId)?.unit;

    const onSubmit = (data: TestNoteSchemaValues) => {
      const id = toaster.create({ type: 'loading', title: t('saving') });

      startTransition(async () => {
        const { success, message: title } = await saveTestNote(
          playerId,
          data,
          note?.note_id,
        );

        toaster.update(id, { type: success ? 'success' : 'error', title });

        if (success) {
          reset();
          AddTestNote.close('add-test-note');
        }
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
                  {note ? t('editTitle') : t('title')}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body paddingTop={0}>
                <Controller
                  name="type_id"
                  control={control}
                  render={({ field }) => (
                    <Field label={t('focusArea')}>
                      <Select.Root
                        collection={focusAreas}
                        disabled={isPending}
                        value={[field.value || GENERAL]}
                        onInteractOutside={field.onBlur}
                        onValueChange={({ value }) =>
                          field.onChange(value[0] === GENERAL ? '' : value[0])
                        }
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t('focusArea')} />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {focusAreas.items.map((option) => (
                                <Select.Item item={option} key={option.value}>
                                  {option.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Field>
                  )}
                />
                <Field
                  required
                  label={t('observation')}
                  invalid={!!errors.content}
                  errorText={errors.content?.message}
                  marginTop={3}
                >
                  <Textarea
                    rows={4}
                    autoresize
                    {...register('content')}
                    disabled={isPending}
                  />
                </Field>
                {typeId && (
                  <Field
                    label={`${t('goal')}${unit ? ` (${unitLabel(unit)})` : ''}`}
                    invalid={!!errors.goal}
                    errorText={errors.goal?.message}
                    marginTop={3}
                  >
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      {...register('goal')}
                      disabled={isPending}
                    />
                  </Field>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  type="submit"
                  loadingText={t('saving')}
                  loading={isPending}
                  disabled={!isValid || isPending}
                >
                  <Save /> {tCommon('save')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  },
);
