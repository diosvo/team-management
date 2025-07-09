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

// Available test types that can be managed
const INITIAL_TEST_TYPES = [
  'Beep test',
  'Plank',
  'Push-ups',
  'Run & Slide',
  'Sit-ups',
  'Sprint Speed',
];

export default function ManageTestTypes({
  usedTestTypes = [],
}: {
  usedTestTypes: Array<string>;
}) {
  const [testTypes, setTestTypes] = useState<string[]>(INITIAL_TEST_TYPES);
  const [name, setName] = useState<string>('');

  const handleAddTestType = () => {
    if (testTypes.includes(name.trim())) {
      toaster.create({
        type: 'error',
        description: 'This test already exists',
      });
      return;
    }

    setTestTypes((prev) => [...prev, name.trim()]);
    setName('');

    toaster.create({
      type: 'success',
      description: `"${name.trim()}" test type successfully`,
    });
  };

  const handleRemoveTestType = (testType: string) => {
    setTestTypes((prev) => prev.filter((type) => type !== testType));

    toaster.create({
      type: 'success',
      description: `"${testType}" test removed successfully`,
    });
  };

  const isTestTypeUsed = (testType: string) => usedTestTypes.includes(testType);

  const usedTypes = testTypes.filter((type) => isTestTypeUsed(type));
  const unusedTypes = testTypes.filter((type) => !isTestTypeUsed(type));

  return (
    <Dialog.Root size="xs">
      <Dialog.Trigger asChild>
        <Button variant="outline" size={{ base: 'sm', md: 'md' }}>
          <Settings />
          Configure Test Types
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
              <Dialog.Title>Configure Test Types</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                <HStack>
                  <Field>
                    <Input
                      placeholder="Enter a name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (name.trim().length > 0 && e.key === 'Enter') {
                          handleAddTestType();
                        }
                      }}
                    />
                  </Field>
                  <Button onClick={handleAddTestType} disabled={!name.trim()}>
                    <Plus />
                    Add
                  </Button>
                </HStack>

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
                      {unusedTypes.map((name) => (
                        <List.Item key={name}>
                          <List.Indicator asChild>
                            <Button
                              size="2xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleRemoveTestType(name)}
                            >
                              <Trash2 />
                            </Button>
                          </List.Indicator>
                          {name}
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
                      {usedTypes.map((name) => (
                        <List.Item key={name} marginLeft={4}>
                          {name}
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
