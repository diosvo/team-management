'use client';

import { useTransition } from 'react';

import {
  Button,
  Dialog,
  Fieldset,
  HStack,
  Input,
  NumberInput,
  Portal,
  RadioGroup,
  Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import {
  AssetCategorySelection,
  AssetConditionSelection,
} from '@/utils/constant';
import { AssetCategory, AssetCondition } from '@/utils/enum';

import { AddItemSchema } from '@/features/asset/schemas/asset';

export default function AddItem() {
  const [isPending, startTransition] = useTransition();

  const {
    reset,
    watch,
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddItemSchema),
    values: {
      name: '',
      quantity: 1,
      condition: AssetCondition.GOOD,
      category: AssetCategory.EQUIPMENT,
      note: '',
    },
  });

  const onSubmit = (data: any) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Adding new item to to the asset inventory...',
    });

    startTransition(async () => {
      const { error, message: description } = {
        error: false,
        message: 'Item added successfully',
      };

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) reset();
    });
  };

  return (
    <Dialog.Root lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <Plus />
          Add
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Add Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack>
                <Field required label="Name">
                  <Input placeholder="Ball #" disabled={isPending} />
                </Field>
                <Field required label="Quantity">
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <NumberInput.Root
                        width="full"
                        disabled={field.disabled}
                        name={field.name}
                        min={1}
                        max={100}
                        value={String(field.value)}
                        onValueChange={({ value }) => {
                          field.onChange(value);
                        }}
                      >
                        <NumberInput.Control />
                        <NumberInput.Input onBlur={field.onBlur} />
                      </NumberInput.Root>
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
                      onValueChange={({ value }) => {
                        field.onChange(value);
                      }}
                    >
                      <HStack gap={4}>
                        {AssetCategorySelection.map((item) => (
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
                helperText="Max 256 characters."
                marginTop={4}
              >
                <Textarea
                  autoresize
                  maxLength={256}
                  placeholder="Comment..."
                  {...register('note')}
                />
              </Field>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} loadingText="Adding...">
                <Plus /> Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
