'use client';

import {
  Button,
  Dialog,
  Fieldset,
  Input,
  Portal,
  RadioGroup,
  Separator,
  SimpleGrid,
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
  usedTestTypes = [],
}: {
  usedTestTypes: Array<string>;
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

            <Dialog.Body>
              <VStack gap={4}>
                <Field required label="Name">
                  <Input
                    maxLength={128}
                    placeholder="Enter test name..."
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

            {usedTestTypes.length > 0 && <Separator />}

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
