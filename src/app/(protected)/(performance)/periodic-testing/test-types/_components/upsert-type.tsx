'use client';

import {
  Button,
  createOverlay,
  Dialog,
  Fieldset,
  Input,
  Portal,
  RadioGroup,
  SimpleGrid,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { TestTypeUnitSelection } from '@/utils/constant';
import { TestTypeUnit } from '@/utils/enum';

import { upsertTestType } from '@/features/periodic-testing/actions/test-type';
import {
  UpsertTestTypeSchema,
  UpsertTestTypeSchemaValues,
} from '@/features/periodic-testing/schemas/periodic-testing';

export const UpsertTestType = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(UpsertTestTypeSchema),
    values: {
      name: item.name,
      unit: TestTypeUnit.SECONDS,
    },
  });

  const onSubmit = (data: UpsertTestTypeSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Saving...',
    });

    startTransition(async () => {
      const { error, message: description } = await upsertTestType(
        item.type_id as string,
        data
      );

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) {
        reset();
      }

      if (action === 'Update') {
        UpsertTestType.close('update-test-type');
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
                    <RadioGroup.Root
                      size="sm"
                      colorPalette="red"
                      marginTop={2}
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => {
                        field.onChange(value);
                      }}
                    >
                      <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
                        {TestTypeUnitSelection.map((item) => (
                          <RadioGroup.Item key={item.value} value={item.value}>
                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>
                              {item.label}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </SimpleGrid>
                    </RadioGroup.Root>
                  )}
                />
              </Fieldset.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} loadingText="Saving...">
                <Save /> {action}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
