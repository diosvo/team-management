'use client';

import { useState } from 'react';

import {
  Button,
  HStack,
  Input,
  Portal,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, Settings, Trash2, X } from 'lucide-react';

import { Field } from '@/components/ui/field';
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toaster } from '@/components/ui/toaster';

// Available test types that can be managed
const INITIAL_TEST_TYPES = [
  'Sprint Speed',
  'Endurance',
  'Vertical Jump',
  'Agility',
  'Strength',
  'Flexibility',
  'Coordination',
  'Balance',
  'Power',
  'Reaction Time',
];

interface ManageTestTypesProps {
  usedTestTypes?: string[]; // Test types currently being used in results
}

export default function ManageTestTypes({
  usedTestTypes = [],
}: ManageTestTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testTypes, setTestTypes] = useState<string[]>(INITIAL_TEST_TYPES);
  const [newTestType, setNewTestType] = useState('');

  const handleAddTestType = () => {
    if (!newTestType.trim()) {
      toaster.create({
        type: 'error',
        description: 'Please enter a test type name',
      });
      return;
    }

    if (testTypes.includes(newTestType.trim())) {
      toaster.create({
        type: 'error',
        description: 'This test type already exists',
      });
      return;
    }

    setTestTypes((prev) => [...prev, newTestType.trim()]);
    setNewTestType('');

    toaster.create({
      type: 'success',
      description: 'Test type added successfully',
    });
  };

  const handleRemoveTestType = (testType: string) => {
    if (usedTestTypes.includes(testType)) {
      toaster.create({
        type: 'error',
        description:
          'Cannot remove test type that is currently being used in test results',
      });
      return;
    }

    setTestTypes((prev) => prev.filter((type) => type !== testType));

    toaster.create({
      type: 'success',
      description: 'Test type removed successfully',
    });
  };

  const isTestTypeUsed = (testType: string) => usedTestTypes.includes(testType);

  return (
    <PopoverRoot
      open={isOpen}
      onOpenChange={(details) => setIsOpen(details.open)}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size={{ base: 'sm', md: 'md' }}>
          <Settings />
          Manage Test Types
        </Button>
      </PopoverTrigger>

      <Portal>
        <PopoverContent maxWidth="600px">
          <PopoverArrow />
          <PopoverHeader>
            <HStack justify="space-between" align="center">
              <Text fontWeight="semibold" fontSize="lg">
                Manage Test Types
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X />
              </Button>
            </HStack>
          </PopoverHeader>

          <PopoverBody>
            <VStack align="stretch" gap={6}>
              {/* Add New Test Type */}
              <VStack align="stretch" gap={4}>
                <Text fontWeight="semibold">Add New Test Type</Text>
                <HStack>
                  <Field flex={1}>
                    <Input
                      placeholder="Enter test type name"
                      value={newTestType}
                      onChange={(e) => setNewTestType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTestType();
                        }
                      }}
                    />
                  </Field>
                  <Button
                    onClick={handleAddTestType}
                    disabled={!newTestType.trim()}
                  >
                    <Plus />
                    Add
                  </Button>
                </HStack>
              </VStack>

              {/* Existing Test Types */}
              <VStack align="stretch" gap={4}>
                <Text fontWeight="semibold">Existing Test Types</Text>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Test Type</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader width="80px">
                        Action
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {testTypes.map((testType) => (
                      <Table.Row key={testType}>
                        <Table.Cell>{testType}</Table.Cell>
                        <Table.Cell>
                          {isTestTypeUsed(testType) ? (
                            <Text fontSize="sm" color="orange.600">
                              In Use
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Available
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => handleRemoveTestType(testType)}
                            disabled={isTestTypeUsed(testType)}
                            title={
                              isTestTypeUsed(testType)
                                ? 'Cannot remove test type that is currently in use'
                                : 'Remove test type'
                            }
                          >
                            <Trash2 />
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </VStack>

              {usedTestTypes.length > 0 && (
                <Text fontSize="sm" color="gray.600">
                  <Text as="span" fontWeight="medium">
                    Note:
                  </Text>{' '}
                  Test types marked as "In Use" cannot be removed as they are
                  currently being used in test results.
                </Text>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </PopoverRoot>
  );
}
