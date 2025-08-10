'use client';

import { useTransition } from 'react';

import {
  Button,
  Dialog,
  Fieldset,
  HStack,
  Input,
  Portal,
  RadioGroup,
  Textarea,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { getDefaults } from '@/lib/zod';
import {
  AssetCategorySelection,
  AssetConditionSelection,
} from '@/utils/constant';

import { upsertAsset } from '@/features/asset/actions/asset';
import {
  UpsertAssetSchema,
  UpsertAssetSchemaValues,
} from '@/features/asset/schemas/asset';

export const UpsertAsset = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(UpsertAssetSchema),
    defaultValues: getDefaults(UpsertAssetSchema, item),
  });

  const onSubmit = (data: UpsertAssetSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Saving item to to the asset inventory...',
    });

    startTransition(async () => {
      const { error, message: description } = await upsertAsset(
        item.asset_id,
        data
      );

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) reset();
      if (action === 'Update') UpsertAsset.close('update-asset');
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
              <Dialog.Title>{action} Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack alignItems="start">
                <Field
                  required
                  label="Name"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder="Ball #"
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  required
                  label="Quantity"
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
              </HStack>
              <Fieldset.Root marginBlock={4}>
                <Fieldset.Legend color="GrayText">Category</Fieldset.Legend>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup.Root
                      size="sm"
                      colorPalette="red"
                      marginTop={2}
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => field.onChange(value)}
                    >
                      <HStack gap={4}>
                        {AssetCategorySelection.map((item) => (
                          <Tooltip key={item.value} content={item.description}>
                            <RadioGroup.Item value={item.value}>
                              <RadioGroup.ItemHiddenInput
                                onBlur={field.onBlur}
                              />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>
                                {item.label}
                              </RadioGroup.ItemText>
                            </RadioGroup.Item>
                          </Tooltip>
                        ))}
                      </HStack>
                    </RadioGroup.Root>
                  )}
                />
              </Fieldset.Root>
              <Fieldset.Root>
                <Fieldset.Legend color="GrayText">Condition</Fieldset.Legend>
                <Controller
                  name="condition"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup.Root
                      size="sm"
                      colorPalette="green"
                      marginTop={2}
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => {
                        field.onChange(value);
                      }}
                    >
                      <HStack gap={4}>
                        {AssetConditionSelection.map((item) => (
                          <RadioGroup.Item key={item.value} value={item.value}>
                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>
                              {item.label}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </HStack>
                    </RadioGroup.Root>
                  )}
                />
              </Fieldset.Root>
              <Field
                label="Note"
                helperText="Max 128 characters."
                marginTop={4}
              >
                <Textarea
                  autoresize
                  maxLength={128}
                  placeholder="Comment..."
                  {...register('note')}
                />
              </Field>
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
