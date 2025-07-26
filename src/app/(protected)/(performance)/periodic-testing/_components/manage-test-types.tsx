'use client';

import {
  Button,
  createListCollection,
  createOverlay,
  Dialog,
  HStack,
  Input,
  Portal,
  Select,
  Separator,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState, useTransition } from 'react';
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

export const ManageTestTypes = createOverlay(
  ({
    list,
    ...rest
  }: {
    list: Array<{ type_id: string; name: string; unit: string }>;
  }) => {
    const [dataList, setDataList] = useState(list);
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
        name: '',
        unit: TestTypeUnit.SECONDS,
      },
    });

    const onSubmit = (data: UpsertTestTypeSchemaValues) => {
      if (
        list.some(
          ({ name }) => name.toLowerCase() === data.name.trim().toLowerCase()
        )
      ) {
        toaster.warning({
          description: 'This test already exists',
        });
      }

      const id = toaster.create({
        type: 'loading',
        description: 'Saving...',
      });

      startTransition(async () => {
        const { error, message: description } = await upsertTestType('', data);

        toaster.update(id, {
          type: error ? 'error' : 'success',
          description,
        });

        if (!error) {
          reset();
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
                <Dialog.Title>Manage Test Types</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body paddingTop={0}>
                <HStack gap={2}>
                  <Field
                    required
                    label="Name"
                    invalid={!!errors.name}
                    errorText={errors.name?.message}
                  >
                    <Input {...register('name')} disabled={isPending} />
                  </Field>
                  <Field required label="Unit">
                    <Controller
                      control={control}
                      name="unit"
                      render={({ field }) => (
                        <Select.Root
                          name={field.name}
                          value={
                            field.value ? [field.value] : [TestTypeUnit.SECONDS]
                          }
                          onValueChange={({ value }) =>
                            field.onChange(value[0])
                          }
                          onInteractOutside={() => field.onBlur()}
                          collection={createListCollection({
                            items: TestTypeUnitSelection,
                          })}
                          disabled={isPending}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger>
                              <Select.ValueText placeholder="Unit" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Select.Positioner>
                            <Select.Content>
                              {TestTypeUnitSelection.map((state) => (
                                <Select.Item item={state} key={state.value}>
                                  {state.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Select.Root>
                      )}
                    />
                  </Field>
                </HStack>
                {list.length > 0 && (
                  <>
                    <Separator marginBlock={4} />
                    {list.map(({ type_id, name, unit }) => (
                      <HStack key={type_id} gap={1}>
                        <Text
                          key={name}
                          _hover={{
                            color: 'tomato',
                            cursor: 'pointer',
                            textDecoration: 'line-through',
                          }}
                          transition="all 0.2s ease-in-out"
                        >
                          {name}
                          <Text
                            as="span"
                            fontSize="xs"
                            color="GrayText"
                            marginLeft={1}
                          >
                            ({unit})
                          </Text>
                        </Text>
                      </HStack>
                    ))}
                  </>
                )}
              </Dialog.Body>

              <Dialog.Footer>
                <Text fontStyle="italic" color="GrayText">
                  Pending changes
                </Text>
                <Button
                  type="submit"
                  loading={isPending}
                  loadingText="Saving..."
                >
                  <Save />
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }
);
