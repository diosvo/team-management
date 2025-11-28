'use client';

import {
  Button,
  createOverlay,
  Dialog,
  Fieldset,
  Input,
  Portal,
  SimpleGrid,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Radio, RadioGroup } from '@/components/ui/radio';
import { toaster } from '@/components/ui/toaster';

import { getDefaults } from '@/lib/zod';
import { TEST_TYPE_UNIT_SELECTION } from '@/utils/constant';

import { upsertTestType } from '@/actions/test-type';
import {
  UpsertTestTypeSchema,
  UpsertTestTypeSchemaValues,
} from '@/schemas/periodic-testing';

export const UpsertTestType = createOverlay(({ action, item, ...rest }) => {
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
      title: 'Saving...',
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
      if (action === 'Update') UpsertTestType.close('update-test-type');
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
              <Dialog.Title>{action} Test Type</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body paddingTop={0}>
              <Field
                required
                label="Name"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input {...register('name')} disabled={isPending} />
              </Field>
              <Fieldset.Root marginTop={3}>
                <Fieldset.Legend color="GrayText">Unit</Fieldset.Legend>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      size="sm"
                      colorPalette="red"
                      marginTop={2}
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => field.onChange(value)}
                    >
                      <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
                        {TEST_TYPE_UNIT_SELECTION.map((item) => (
                          <Radio
                            key={item.value}
                            value={item.value}
                            onBlur={field.onBlur}
                          >
                            {item.label}
                          </Radio>
                        ))}
                      </SimpleGrid>
                    </RadioGroup>
                  )}
                />
              </Fieldset.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText="Saving..."
                loading={isPending}
                disabled={!isValid || isPending}
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
