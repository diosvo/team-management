'use client';

import { useState } from 'react';

import {
  Button,
  createListCollection,
  Dialog,
  HStack,
  Input,
  Portal,
  Select,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link, Plus, Upload } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

interface AddTestResultDialogProps {
  onAddResult: (result: {
    player_name: string;
    test_type: string;
    test_date: string;
    score: number;
    notes?: string;
  }) => void;
}

export default function AddTestResult({
  onAddResult,
}: AddTestResultDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<
    'manual' | 'excel' | 'google-sheets'
  >('manual');
  const [formData, setFormData] = useState({
    player_name: '',
    test_type: '',
    test_date: '',
    score: '',
    notes: '',
  });
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');

  const testTypes = createListCollection({
    items: [
      { value: 'Sprint Speed', label: 'Sprint Speed' },
      { value: 'Endurance', label: 'Endurance' },
      { value: 'Vertical Jump', label: 'Vertical Jump' },
      { value: 'Agility', label: 'Agility' },
      { value: 'Free Throw %', label: 'Free Throw %' },
      { value: 'Three Point %', label: 'Three Point %' },
      { value: 'Field Goal %', label: 'Field Goal %' },
      { value: 'Ball Handling', label: 'Ball Handling' },
      { value: 'Game IQ', label: 'Game IQ' },
      { value: 'Decision Making', label: 'Decision Making' },
      { value: 'Team Play', label: 'Team Play' },
      { value: 'Defense', label: 'Defense' },
    ],
  });

  const handleSubmit = () => {
    if (
      !formData.player_name ||
      !formData.test_type ||
      !formData.test_date ||
      !formData.score
    ) {
      toaster.create({
        type: 'error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    onAddResult({
      player_name: formData.player_name,
      test_type: formData.test_type,
      test_date: formData.test_date,
      score: parseFloat(formData.score),
      notes: formData.notes || undefined,
    });
    setFormData({
      player_name: '',
      test_type: '',
      test_date: '',
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

    // Mock implementation - simulate processing multiple test results
    // In a real implementation, you would:
    // 1. Extract the spreadsheet ID from the URL (match[1])
    // 2. Convert to CSV export URL: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
    // 3. Fetch the CSV data (requires CORS or backend proxy)
    // 4. Parse CSV and validate data
    // 5. Call onAddResult for each valid row

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
          test_date: '2024-06-20',
          score: 87.5,
          notes: 'Imported from Google Sheets',
        },
        {
          player_name: 'Lisa Chen',
          test_type: 'Vertical Jump',
          test_date: '2024-06-20',
          score: 91.2,
          notes: 'Imported from Google Sheets',
        },
        {
          player_name: 'Marcus Johnson',
          test_type: 'Endurance',
          test_date: '2024-06-20',
          score: 82.7,
          notes: 'Imported from Google Sheets',
        },
      ];

      // Import each record
      mockImportedData.forEach((record) => {
        onAddResult(record);
      });

      setGoogleSheetsUrl('');
      setIsOpen(false);

      toaster.create({
        type: 'success',
        description: `Successfully imported ${mockImportedData.length} test results from Google Sheets`,
      });
    }, 2000);
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      toaster.create({
        type: 'error',
        description:
          'Please upload a valid Excel file (.xlsx, .xls) or CSV file',
      });
      return;
    }

    toaster.create({
      type: 'loading',
      description: 'Processing Excel file...',
    });

    // Mock implementation - simulate processing
    // In a real implementation, you would use a library like SheetJS (xlsx)
    // to parse the Excel file and extract data
    setTimeout(() => {
      const mockExcelData = [
        {
          player_name: 'Emma Wilson',
          test_type: 'Agility',
          test_date: '2024-06-21',
          score: 88.9,
          notes: 'Imported from Excel',
        },
        {
          player_name: 'Ryan Martinez',
          test_type: 'Free Throw %',
          test_date: '2024-06-21',
          score: 76.3,
          notes: 'Imported from Excel',
        },
      ];

      // Import each record
      mockExcelData.forEach((record) => {
        onAddResult(record);
      });

      // Clear the input
      event.target.value = '';
      setIsOpen(false);

      toaster.create({
        type: 'success',
        description: `Successfully imported ${mockExcelData.length} test results from Excel file`,
      });
    }, 1500);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <Plus />
          Add Test Result
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxWidth="md">
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Add Test Result</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                {/* Import Method Selection */}
                <HStack gap={3} wrap="wrap">
                  <Button
                    variant={importMethod === 'manual' ? 'solid' : 'outline'}
                    size="sm"
                    onClick={() => setImportMethod('manual')}
                  >
                    <Plus />
                    Manual Entry
                  </Button>
                  <Button
                    variant={importMethod === 'excel' ? 'solid' : 'outline'}
                    size="sm"
                    onClick={() => setImportMethod('excel')}
                  >
                    <Upload />
                    Excel Upload
                  </Button>
                  <Button
                    variant={
                      importMethod === 'google-sheets' ? 'solid' : 'outline'
                    }
                    size="sm"
                    onClick={() => setImportMethod('google-sheets')}
                  >
                    <Link />
                    Google Sheets
                  </Button>
                </HStack>

                {importMethod === 'manual' ? (
                  <Stack gap={4}>
                    <Field label="Player Name" required>
                      <Input
                        value={formData.player_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            player_name: e.target.value,
                          })
                        }
                        placeholder="Enter player name"
                      />
                    </Field>

                    <Field label="Test Type" required>
                      <Select.Root
                        collection={testTypes}
                        value={formData.test_type ? [formData.test_type] : []}
                        onValueChange={(details) =>
                          setFormData({
                            ...formData,
                            test_type: details.value[0] || '',
                          })
                        }
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select test type" />
                        </Select.Trigger>
                        <Select.Content>
                          {testTypes.items.map((type) => (
                            <Select.Item key={type.value} item={type}>
                              {type.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Field>

                    <Field label="Test Date" required>
                      <Input
                        type="date"
                        value={formData.test_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            test_date: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Score" required>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.score}
                        onChange={(e) =>
                          setFormData({ ...formData, score: e.target.value })
                        }
                        placeholder="Enter score (0-100)"
                      />
                    </Field>

                    <Field label="Notes">
                      <Input
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Additional notes (optional)"
                      />
                    </Field>
                  </Stack>
                ) : importMethod === 'excel' ? (
                  <VStack align="stretch" gap={4}>
                    <Text fontSize="sm" color="gray.600">
                      Upload an Excel file with test results. The file should
                      contain columns: Player Name, Test Type, Test Date, Score,
                      Notes
                    </Text>

                    <Field label="Excel File">
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelUpload}
                      />
                    </Field>

                    <VStack
                      align="stretch"
                      gap={2}
                      padding={4}
                      backgroundColor="gray.50"
                      borderRadius="md"
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        Expected File Format:
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column A: Player Name (required)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column B: Test Type (required)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column C: Test Date (YYYY-MM-DD format)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column D: Score (0-100)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column E: Notes (optional)
                      </Text>
                    </VStack>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap={4}>
                    <Text fontSize="sm" color="gray.600">
                      Import test results directly from a Google Sheets
                      spreadsheet. Make sure the sheet is publicly accessible or
                      shared with view permissions.
                    </Text>

                    <Field label="Google Sheets URL" required>
                      <Input
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </Field>

                    <VStack
                      align="stretch"
                      gap={2}
                      padding={4}
                      backgroundColor="blue.50"
                      borderRadius="md"
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        Google Sheets Setup:
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        1. Create a Google Sheet with the expected format below
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        2. Share the sheet with "Anyone with the link can view"
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        3. Copy and paste the share URL here
                      </Text>
                    </VStack>

                    <VStack
                      align="stretch"
                      gap={2}
                      padding={4}
                      backgroundColor="gray.50"
                      borderRadius="md"
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        Expected Sheet Format:
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column A: Player Name (required)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column B: Test Type (required)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column C: Test Date (YYYY-MM-DD format)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column D: Score (0-100)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • Column E: Notes (optional)
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        • First row should contain headers
                      </Text>
                    </VStack>
                  </VStack>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline">Cancel</Button>

              {importMethod === 'manual' && (
                <Button onClick={handleSubmit}>Add Result</Button>
              )}

              {importMethod === 'google-sheets' && (
                <Button onClick={handleGoogleSheetsImport}>
                  Import from Google Sheets
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
