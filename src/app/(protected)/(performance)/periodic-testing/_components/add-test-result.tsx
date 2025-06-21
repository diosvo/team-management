'use client';

import { useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  HStack,
  Input,
  List,
  Portal,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, UploadCloud } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

interface AddTestResultDialogProps {
  onAddResult: (result: {
    player_name: string;
    test_type: string;
    score: number;
    notes?: string;
  }) => void;
  existingTestDates?: string[]; // Add this to track existing test dates
}

export default function AddTestResult({
  onAddResult,
  existingTestDates = [], // Default to empty array
}: AddTestResultDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    player_name: '',
    test_type: '',
    score: '',
    notes: '',
  });
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];
  const [selectedTestDate, setSelectedTestDate] = useState(today);

  const handleSubmit = () => {
    if (!formData.player_name || !formData.test_type || !formData.score) {
      toaster.create({
        type: 'error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    onAddResult({
      player_name: formData.player_name,
      test_type: formData.test_type,
      score: parseFloat(formData.score),
      notes: formData.notes || undefined,
    });
    setFormData({
      player_name: '',
      test_type: '',
      score: '',
      notes: '',
    });

    setGoogleSheetsUrl('');
    setIsOpen(false);

    toaster.create({
      type: 'success',
      description: 'Test result added successfully',
    });
  };

  const handleGoogleSheetsImport = () => {
    if (!googleSheetsUrl.trim()) {
      toaster.create({
        type: 'error',
        description: 'Please enter a valid Google Sheets URL',
      });
      return;
    }

    if (!selectedTestDate) {
      toaster.create({
        type: 'error',
        description: 'Please select a testing date',
      });
      return;
    }

    // Validate Google Sheets URL format
    const googleSheetsPattern =
      /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = googleSheetsUrl.match(googleSheetsPattern);

    if (!match) {
      toaster.create({
        type: 'error',
        description:
          'Please enter a valid Google Sheets URL. It should start with "https://docs.google.com/spreadsheets/d/"',
      });
      return;
    }

    toaster.create({
      type: 'loading',
      description: 'Processing Google Sheets data...',
    });

    // Simulate async processing
    setTimeout(() => {
      // Mock data that would come from Google Sheets
      const mockImportedData = [
        {
          player_name: 'David Thompson',
          test_type: 'Sprint Speed',
          score: 87.5,
          notes: 'Imported from Google Sheets',
        },
        {
          player_name: 'Lisa Chen',
          test_type: 'Vertical Jump',
          score: 91.2,
          notes: 'Imported from Google Sheets',
        },
        {
          player_name: 'Marcus Johnson',
          test_type: 'Endurance',
          score: 82.7,
          notes: 'Imported from Google Sheets',
        },
      ];

      // Import each record
      mockImportedData.forEach((record) => {
        onAddResult(record);
      });

      setGoogleSheetsUrl('');
      setSelectedTestDate('');
      setIsOpen(false);

      toaster.create({
        type: 'success',
        description: `Successfully imported ${mockImportedData.length} test results from Google Sheets`,
      });
    }, 2000);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <Plus />
          Import
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
              <Dialog.Title>Upload Test Result</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Import test results directly from a Google Sheets spreadsheet.
                  <br />
                  Make sure the sheet is publicly accessible.
                </Text>

                <VStack align="stretch" gap={4} marginBlock={2}>
                  <HStack>
                    <Field label="Google Sheets URL" required>
                      <Input
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </Field>

                    <Field label="Date" maxWidth="max-content" required>
                      <Input
                        type="date"
                        max={today}
                        value={selectedTestDate}
                        onChange={(e) => setSelectedTestDate(e.target.value)}
                      />
                    </Field>
                  </HStack>
                </VStack>

                <VStack
                  align="stretch"
                  gap={2}
                  paddingInline={6}
                  paddingBlock={2}
                  backgroundColor="gray.50"
                  marginBlock={2}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Google Sheets Setup:
                  </Text>
                  <List.Root as="ol" gap={2}>
                    <List.Item>
                      <Text fontSize="sm" color="gray.600">
                        Create a Google Sheet with the expected format below
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text fontSize="sm" color="gray.600">
                        Share the sheet with "Anyone with the link can view"
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text fontSize="sm" color="gray.600">
                        Copy and paste the share URL here
                      </Text>
                    </List.Item>
                  </List.Root>
                </VStack>

                <Box>
                  <Text fontSize="sm" marginBottom={4}>
                    💥 Expected for sample format:
                  </Text>
                  <Table.Root size="sm" showColumnBorder>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader></Table.ColumnHeader>
                        <Table.ColumnHeader>A</Table.ColumnHeader>
                        <Table.ColumnHeader>B</Table.ColumnHeader>
                        <Table.ColumnHeader>C</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell>1</Table.Cell>
                        <Table.Cell>Player Name</Table.Cell>
                        <Table.Cell>Test Type</Table.Cell>
                        <Table.Cell>Test Date</Table.Cell>
                      </Table.Row>
                      <Table.Row backgroundColor="gray.25">
                        <Table.Cell>2</Table.Cell>
                        <Table.Cell>John Doe</Table.Cell>
                        <Table.Cell>Sprint Speed</Table.Cell>
                        <Table.Cell>2024-06-20</Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                  <Text
                    fontSize="sm"
                    color="GrayText"
                    fontStyle="italic"
                    marginTop={4}
                  >
                    Row 1 contains headers, data starts from row 2
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button onClick={handleGoogleSheetsImport}>
                <UploadCloud /> Import
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
