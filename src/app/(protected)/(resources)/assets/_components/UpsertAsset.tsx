'use client';

import { useTransition } from 'react';

import {
  Button,
  Dialog,
  Fieldset,
  HStack,
  Input,
  Portal,
  SimpleGrid,
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
import { Radio, RadioGroup } from '@/components/ui/radio';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { OnePlayerSelection } from '@/components/user/PlayerSelection';

import { getDefaults, onError } from '@/lib/zod';
import {
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
  CURRENT_DATE,
  ESTABLISHED_DATE,
} from '@/utils/constant';
import { AssetCondition } from '@/utils/enum';

import { upsertAsset } from '@/actions/asset';
import { UpsertAssetSchema, UpsertAssetSchemaValues } from '@/schemas/asset';

export const UpsertAsset = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isValid, isDirty, errors },
  } = useForm({
    resolver: zodResolver(UpsertAssetSchema),
    defaultValues: getDefaults(UpsertAssetSchema, item),
  });

  const onSubmit = (data: UpsertAssetSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving item to the asset inventory...',
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

      if (success) reset();
      if (action === 'Update') UpsertAsset.close('update-asset');
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
              <Dialog.Title>{action} Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={2} gap={4}>
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
                <Field label="Acquired date">
                  <Input
                    type="date"
                    min={ESTABLISHED_DATE}
                    max={CURRENT_DATE}
                    {...register('acquired_date')}
                  />
                </Field>
                <OnePlayerSelection
                  control={control}
                  name="assigned_to"
                  label="owner"
                />
              </SimpleGrid>
              <Fieldset.Root marginBlock={4}>
                <Fieldset.Legend color="GrayText">Category</Fieldset.Legend>
                <Controller
                  name="category"
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
                      <HStack gap={4}>
                        {ASSET_CATEGORY_SELECTION.map((item) => (
                          <Tooltip key={item.value} content={item.description}>
                            <Radio value={item.value} onBlur={field.onBlur}>
                              {item.label}
                            </Radio>
                          </Tooltip>
                        ))}
                      </HStack>
                    </RadioGroup>
                  )}
                />
              </Fieldset.Root>
              <Fieldset.Root>
                <Fieldset.Legend color="GrayText">Condition</Fieldset.Legend>
                <Controller
                  name="condition"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
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
                        {ASSET_CONDITION_SELECTION.map((item) => (
                          <Radio
                            key={item.value}
                            value={item.value}
                            onBlur={field.onBlur}
                            hidden={
                              action === 'Add' &&
                              item.value === AssetCondition.OBSOLETE
                            }
                          >
                            {item.label}
                          </Radio>
                        ))}
                      </HStack>
                    </RadioGroup>
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
                disabled={!isValid || !isDirty || isPending}
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
