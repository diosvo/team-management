'use client';

import {
  Button,
  createOverlay,
  Dialog,
  Fieldset,
  HStack,
  Input,
  Portal,
  RadioGroup,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, RotateCcw } from 'lucide-react';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';

import { getDefaults } from '@/lib/zod';
import { TestTypeUnitSelection } from '@/utils/constant';
import { zodResolver } from '@hookform/resolvers/zod';

import { toaster } from '@/components/ui/toaster';
import { upsertTestType } from '@/features/periodic-testing/actions/test-type';
import {
  UpsertTestTypeSchema,
  UpsertTestTypeSchemaValues,
} from '@/features/periodic-testing/schemas/periodic-testing';

export const ManageTestTypes = createOverlay(
  ({ list, ...rest }: { list: Array<{ name: string; unit: string }> }) => {
    const [isPending, startTransition] = useTransition();

    const { reset, control, register, handleSubmit } = useForm({
      resolver: zodResolver(UpsertTestTypeSchema),
      values: getDefaults(UpsertTestTypeSchema),
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
        const { error, message: description } = await upsertTestType(
          '',
          data.name
        );

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
      <Dialog.Root size="xs" {...rest}>
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
                {list.length > 0 && (
                  <>
                    <HStack marginBottom={2}>
                      <Separator flex="1" />
                      <Text flexShrink="0">All</Text>
                      <Separator flex="1" />
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                      {list.map(({ name, unit }) => (
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
                      ))}
                    </SimpleGrid>
                  </>
                )}
                <HStack marginBottom={2}>
                  <Separator flex={1} />
                  <Text flexShrink={0}>Add</Text>
                  <Separator flex={1} />
                </HStack>
                <VStack gap={4}>
                  <Field required label="Name">
                    <Input
                      maxLength={128}
                      placeholder="Enter  test name..."
                      {...register('name')}
                    />
                  </Field>
                  <Fieldset.Root>
                    <Fieldset.Legend color="GrayText">Unit</Fieldset.Legend>
                    <Controller
                      name="unit"
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
                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
                            {TestTypeUnitSelection.map((item) => (
                              <RadioGroup.Item
                                key={item.value}
                                value={item.value}
                              >
                                <RadioGroup.ItemHiddenInput
                                  onBlur={field.onBlur}
                                />
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
                </VStack>
              </Dialog.Body>

              <Dialog.Footer justifyContent="space-between">
                <Button variant="outline" colorPalette="red" onClick={reset}>
                  <RotateCcw />
                  Reset
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  loadingText="Adding..."
                >
                  <Plus />
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }
);
