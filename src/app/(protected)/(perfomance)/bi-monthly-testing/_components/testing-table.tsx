'use client';

import { useState } from 'react';

import { Badge, Button, HStack, Table } from '@chakra-ui/react';
import { Calendar, Eye, FileText, Plus } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/utils/formatter';

interface TestResult {
  test_id: string;
  player_name: string;
  test_type: string;
  test_date: string;
  score: number;
  previous_score?: number;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
}

interface TestingTableProps {
  testResults: Array<TestResult>;
}

export default function TestingTable({ testResults }: TestingTableProps) {
  const { isAdmin, isGuest } = usePermissions();
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getScoreColor = (score: number, previousScore?: number) => {
    if (!previousScore) return 'gray';
    if (score > previousScore) return 'green';
    if (score < previousScore) return 'red';
    return 'yellow';
  };

  const getScoreImprovement = (score: number, previousScore?: number) => {
    if (!previousScore) return null;
    const diff = score - previousScore;
    const percentage = ((diff / previousScore) * 100).toFixed(1);
    return {
      diff,
      percentage: diff >= 0 ? `+${percentage}%` : `${percentage}%`,
      isImprovement: diff >= 0,
    };
  };

  return (
    <>
      <HStack marginBottom={4} justifyContent="space-between">
        <Button size={{ base: 'sm', md: 'md' }} variant="outline">
          <Calendar />
          Schedule Test
        </Button>

        <Visibility isVisible={isAdmin}>
          <HStack>
            <Button size={{ base: 'sm', md: 'md' }} variant="outline">
              <FileText />
              Export Results
            </Button>
            <Button size={{ base: 'sm', md: 'md' }}>
              <Plus />
              Add Test Result
            </Button>
          </HStack>
        </Visibility>
      </HStack>

      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={testResults.length > 0}
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Player</Table.ColumnHeader>
              <Table.ColumnHeader>Test Type</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Score</Table.ColumnHeader>
              <Table.ColumnHeader>Previous</Table.ColumnHeader>
              <Table.ColumnHeader>Change</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {testResults.length > 0 ? (
              testResults.map((result) => {
                const improvement = getScoreImprovement(
                  result.score,
                  result.previous_score
                );

                return (
                  <Table.Row
                    key={result.test_id}
                    _hover={{ cursor: 'pointer', backgroundColor: 'gray.50' }}
                    onClick={() => setSelectedTest(result)}
                  >
                    <Table.Cell fontWeight="medium">
                      {result.player_name}
                    </Table.Cell>
                    <Table.Cell>{result.test_type}</Table.Cell>
                    <Table.Cell>{formatDate(result.test_date)}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant="surface"
                        borderRadius="full"
                        colorPalette={getScoreColor(
                          result.score,
                          result.previous_score
                        )}
                      >
                        {result.score}%
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {result.previous_score
                        ? `${result.previous_score}%`
                        : '-'}
                    </Table.Cell>
                    <Table.Cell>
                      {improvement ? (
                        <Badge
                          variant="outline"
                          borderRadius="full"
                          colorPalette={
                            improvement.isImprovement ? 'green' : 'red'
                          }
                        >
                          {improvement.percentage}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant="surface"
                        borderRadius="full"
                        colorPalette={getStatusColor(result.status)}
                      >
                        {result.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setSelectedTest(result)}
                      >
                        <Eye size={14} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={8}>
                  <EmptyState
                    icon={<FileText />}
                    title="No test results found"
                    description="No bi-monthly testing data available yet"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </>
  );
}
