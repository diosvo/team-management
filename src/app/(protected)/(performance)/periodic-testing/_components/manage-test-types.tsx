'use client';

import {
  Button,
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
import { Plus, RotateCcw, Settings } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { UpsertTestTypeSchema } from '@/features/periodic-testing/schemas/periodic-testing';
import { getDefaults } from '@/lib/zod';
import { TestTypeUnitSelection } from '@/utils/constant';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

export default function ManageTestTypes({
  list = [],
}: {
  list: Array<string>;
}) {
  const { reset, control, register, handleSubmit } = useForm({
    resolver: zodResolver(UpsertTestTypeSchema),
    values: getDefaults(UpsertTestTypeSchema),
  });

  // const handleAddTestType = () => {
  //   if (testTypes.some((type) => type.name === name.trim())) {
  //     toaster.create({
  //       type: 'error',
  //       description: 'This test already exists',
  //     });
  //     return;
  //   }

  //   const newTestType = {
  //     name: name.trim(),
  //     unit: selectedUnit,
  //   };

  //   setTestTypes((prev) => [...prev, newTestType]);
  //   setName('');

  //   toaster.create({
  //     type: 'success',
  //     description: `"${name.trim()}" test type added successfully`,
  //   });
  // };

  // const handleRemoveTestType = (testType) => {
  //   setTestTypes((prev) => prev.filter((type) => type.name !== testType.name));

  //   toaster.create({
  //     type: 'success',
  //     description: `"${testType.name}" test removed successfully`,
  //   });
  // };

  const onSubmit = () => {};

  return (
    <Dialog.Root size="xs">
      <Dialog.Trigger asChild>
        <Button variant="outline" size={{ base: 'sm', md: 'md' }}>
          <Settings />
          Manage Test Types
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
              <Dialog.Title>Manage Test Types</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body paddingTop={0}>
              <HStack marginBottom={2}>
                <Separator flex="1" />
                <Text flexShrink="0">Add</Text>
                <Separator flex="1" />
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

              {list.length > 0 && (
                <>
                  <HStack marginBottom={2} marginTop={4}>
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
                        {/* <IconButton size="xs" variant="ghost" colorPalette="red">
                        <Trash2 />
                      </IconButton> */}
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
            </Dialog.Body>

            <Dialog.Footer justifyContent="space-between">
              <Button variant="outline" colorPalette="red" onClick={reset}>
                <RotateCcw />
                Reset
              </Button>
              <Button onClick={() => {}}>
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
