'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  HStack,
  Input,
  List,
  Portal,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FileX, Plus, Settings, Trash2 } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import {
  TEST_TYPE_UNITS,
  TestType,
  TestTypeUnit,
} from '@/features/periodic-testing/types';
import { INITIAL_TEST_TYPES } from '@/utils/constant';

export default function ManageTestTypes({
  usedTestTypes = [],
}: {
  usedTestTypes: Array<string>;
}) {
  const [testTypes, setTestTypes] = useState<TestType[]>(
    INITIAL_TEST_TYPES.map((item) => ({
      name: item.name,
      unit: item.unit as TestTypeUnit,
    }))
  );
  const [name, setName] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<TestTypeUnit>('times');

  const handleAddTestType = () => {
    if (testTypes.some((type) => type.name === name.trim())) {
      toaster.create({
        type: 'error',
        description: 'This test already exists',
      });
      return;
    }

    const newTestType: TestType = {
      name: name.trim(),
      unit: selectedUnit,
    };

    setTestTypes((prev) => [...prev, newTestType]);
    setName('');

    toaster.create({
      type: 'success',
      description: `"${name.trim()}" test type added successfully`,
    });
  };

  const handleRemoveTestType = (testType: TestType) => {
    setTestTypes((prev) => prev.filter((type) => type.name !== testType.name));

    toaster.create({
      type: 'success',
      description: `"${testType.name}" test removed successfully`,
    });
  };

  const isTestTypeUsed = (testType: TestType) =>
    usedTestTypes.includes(testType.name);

  const usedTypes = testTypes.filter((type) => isTestTypeUsed(type));
  const unusedTypes = testTypes.filter((type) => !isTestTypeUsed(type));

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
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>

            <Dialog.Header>
              <Dialog.Title>Manage Test Types</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                <VStack align="stretch" gap={4}>
                  <Field>
                    <Input
                      placeholder="Enter test type name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (name.trim().length > 0 && e.key === 'Enter') {
                          handleAddTestType();
                        }
                      }}
                    />
                  </Field>

                  <Field>
                    <select
                      value={selectedUnit}
                      onChange={(e) =>
                        setSelectedUnit(e.target.value as TestTypeUnit)
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        backgroundColor: 'white',
                      }}
                    >
                      {TEST_TYPE_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Button
                    onClick={handleAddTestType}
                    disabled={!name.trim()}
                    width="full"
                  >
                    <Plus />
                    Add Test Type
                  </Button>
                </VStack>

                {unusedTypes.length > 0 && (
                  <>
                    <HStack>
                      <Separator flex={1} />
                      <Text flexShrink={0} color="tomato">
                        Unused
                      </Text>
                      <Separator flex={1} />
                    </HStack>
                    <List.Root variant="plain" align="center" gap={1}>
                      {unusedTypes.map((testType) => (
                        <List.Item key={testType.name}>
                          <List.Indicator asChild>
                            <Button
                              size="2xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleRemoveTestType(testType)}
                            >
                              <Trash2 />
                            </Button>
                          </List.Indicator>
                          <Text>
                            {testType.name} ({testType.unit})
                          </Text>
                        </List.Item>
                      ))}
                    </List.Root>
                  </>
                )}

                {usedTypes.length > 0 && (
                  <>
                    <HStack>
                      <Separator flex={1} />
                      <Text flexShrink={0}>Being used</Text>
                      <Separator flex={1} />
                    </HStack>
                    <List.Root>
                      {usedTypes.map((testType) => (
                        <List.Item key={testType.name} marginLeft={4}>
                          <Text>
                            {testType.name} ({testType.unit})
                          </Text>
                        </List.Item>
                      ))}
                    </List.Root>
                  </>
                )}

                {unusedTypes.length === 0 && usedTypes.length === 0 && (
                  <EmptyState
                    icon={<FileX />}
                    title="No test types available"
                    description="Add a new test type to get started"
                  />
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
