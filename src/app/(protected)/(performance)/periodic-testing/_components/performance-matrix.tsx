'use client';

import { useMemo, useState } from 'react';

import { Button, HStack, Icon, Table, Text, VStack } from '@chakra-ui/react';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Tooltip } from '@/components/ui/tooltip';

interface TestResult {
  test_id: string;
  player_name: string;
  test_type: string;
  score: number;
  previous_score?: number;
  notes?: string;
  unit: string;
  value_type: string;
}

interface PlayerTestMatrix {
  player_name: string;
  tests: Record<
    string,
    {
      score: number;
      previous_score?: number;
      improvement?: number;
      unit: string;
      value_type: string;
    }
  >;
}

interface TestTypesOverviewProps {
  testResults: Array<TestResult>;
  searchTerm?: string;
  onUpdateScore?: (
    playerName: string,
    testType: string,
    newScore: number
  ) => void;
}

// Helper function to categorize test types
const getTestCategory = (
  testType: string
): 'physical' | 'skills' | 'tactical' | 'endurance' => {
  const physicalTests = [
    'Beep test',
    'Plank',
    'Run n slide',
    'Sit-ups',
    'Push-ups',
  ];

  if (physicalTests.includes(testType)) return 'physical';
  return 'physical'; // default - all current tests are physical
};

// Helper function to determine if higher values are better for a specific test
const isHigherBetter = (testType: string): boolean => {
  const higherIsBetterTests = [
    'Beep test',
    'Plank',
    'Sit-ups',
    'Push-ups',
    'Run n slide',
  ];

  return higherIsBetterTests.includes(testType);
};

export default function TestTypesOverview({
  testResults,
  searchTerm = '',
  onUpdateScore,
}: TestTypesOverviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10; // Fixed at 10 players per page

  const { playerMatrix, allTestTypes, testTypeUnits } = useMemo(() => {
    const playerMap = new Map<string, PlayerTestMatrix>();
    const testTypesSet = new Set<string>();
    const unitMap = new Map<string, string>();

    // Process test results to create player-test matrix
    testResults.forEach((result) => {
      testTypesSet.add(result.test_type);
      unitMap.set(result.test_type, result.unit);

      if (!playerMap.has(result.player_name)) {
        playerMap.set(result.player_name, {
          player_name: result.player_name,
          tests: {},
        });
      }

      const player = playerMap.get(result.player_name)!;
      let improvement: number | undefined;

      // Calculate improvement if we have a previous score
      if (result.previous_score !== undefined) {
        const rawChange = result.score - result.previous_score;
        const percentChange = (rawChange / result.previous_score) * 100;

        if (result.value_type === 'time') {
          // For time-based tests, check if higher or lower is better
          improvement = isHigherBetter(result.test_type)
            ? percentChange
            : -percentChange;
        } else {
          // For count/percentage tests, higher is better
          improvement = percentChange;
        }
      }

      // Always use the latest result (or overwrite if it's the same test type)
      player.tests[result.test_type] = {
        score: result.score,
        previous_score: result.previous_score,
        improvement,
        unit: result.unit,
        value_type: result.value_type,
      };
    });

    // Sort test types by category and then alphabetically
    const sortedTestTypes = Array.from(testTypesSet).sort((a, b) => {
      const categoryA = getTestCategory(a);
      const categoryB = getTestCategory(b);

      if (categoryA !== categoryB) {
        const categoryOrder = ['physical', 'skills', 'tactical', 'endurance'];
        return (
          categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB)
        );
      }

      return a.localeCompare(b);
    });

    return {
      playerMatrix: Array.from(playerMap.values()).sort((a, b) =>
        a.player_name.localeCompare(b.player_name)
      ),
      allTestTypes: sortedTestTypes,
      testTypeUnits: Object.fromEntries(unitMap),
    };
  }, [testResults]);

  // Filter and paginate players
  const { filteredPlayers, totalPages, startIndex, endIndex, totalPlayers } =
    useMemo(() => {
      // Filter players based on search term
      const filtered = playerMatrix.filter((player) =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Calculate pagination
      const total = Math.ceil(filtered.length / playersPerPage);
      const start = (currentPage - 1) * playersPerPage;
      const end = Math.min(start + playersPerPage, filtered.length);
      const paginated = filtered.slice(start, end);

      return {
        filteredPlayers: paginated,
        totalPages: total,
        startIndex: start + 1,
        endIndex: end,
        totalPlayers: filtered.length,
      };
    }, [playerMatrix, searchTerm, currentPage, playersPerPage]);

  // Reset to first page when search term changes
  const handleSearchChange = (value: string) => {
    setCurrentPage(1);
  };

  const getCategoryColor = (testType: string) => {
    const category = getTestCategory(testType);
    switch (category) {
      case 'physical':
        return 'blue';
      case 'skills':
        return 'purple';
      case 'tactical':
        return 'orange';
      case 'endurance':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getScoreDisplay = (
    testData: PlayerTestMatrix['tests'][string] | undefined,
    playerName: string,
    testType: string
  ) => {
    if (!testData) {
      return {
        element: (
          <Text color="gray.400" fontSize="sm">
            -
          </Text>
        ),
        sortValue: -1,
      };
    }

    const getScoreColor = () => {
      if (testData.improvement !== undefined) {
        if (testData.improvement > 0) return 'green.600';
        if (testData.improvement < 0) return 'red.600';
        return 'gray.600';
      }
      return 'gray.700';
    };

    const improvementIcon =
      testData.improvement !== undefined ? (
        testData.improvement > 0 ? (
          <Icon color="green.500" size="xs">
            <TrendingUp />
          </Icon>
        ) : testData.improvement < 0 ? (
          <Icon color="red.500" size="xs">
            <TrendingDown />
          </Icon>
        ) : (
          <Icon color="gray.500" size="xs">
            <Minus />
          </Icon>
        )
      ) : null;

    // Calculate tooltip content - show actual difference with units, not percentage
    const calculateTooltipContent = () => {
      if (
        !testData.previous_score ||
        !testData.improvement ||
        testData.improvement === 0
      ) {
        return null; // No tooltip for no improvement or zero improvement
      }

      // Calculate the actual value difference
      const rawDifference = testData.score - testData.previous_score;

      // Format the difference value for display
      const formattedDifference =
        testData.value_type === 'time'
          ? Math.abs(rawDifference).toFixed(2).replace('.', ',')
          : Math.abs(rawDifference).toString();

      // Determine the sign based on whether it's an improvement or not
      const sign = testData.improvement > 0 ? '+' : '-';
      return `${sign}${formattedDifference}`;
    };

    const tooltipContent = calculateTooltipContent();

    // Format score based on value type and unit
    const formatScore = (score: number, unit: string, valueType: string) => {
      if (valueType === 'time') {
        // For time values, show with comma as decimal separator (no unit in cell)
        return score.toFixed(2).replace('.', ',');
      } else if (unit === '%') {
        // For percentages, show with % symbol
        return `${score.toFixed(1)}%`;
      } else {
        // For other counts, show whole number (no unit in cell)
        return Math.round(score).toString();
      }
    };

    const cellContent = (
      <VStack
        gap={1}
        align="center"
        cursor="pointer"
        _hover={{
          backgroundColor: 'bg.muted',
          '& .improvement-text': {
            opacity: 1,
          },
        }}
        paddingBlock={1}
        borderRadius="md"
        onClick={() => handleCellClick(playerName, testType, testData.score)}
      >
        <HStack gap={1}>
          <Text color={getScoreColor()} fontSize="sm" fontWeight="medium">
            {formatScore(testData.score, testData.unit, testData.value_type)}
          </Text>
          {improvementIcon}
        </HStack>
      </VStack>
    );

    return {
      element: tooltipContent ? (
        <Tooltip content={tooltipContent}>{cellContent}</Tooltip>
      ) : (
        cellContent
      ),
      sortValue: testData.score,
    };
  };

  // Handle cell click for editing (admin/coach role)
  const handleCellClick = (
    playerName: string,
    testType: string,
    currentScore: number
  ) => {
    // TODO: Add role checking here
    // if (userRole !== 'admin' && userRole !== 'coach') return;

    const newScore = prompt(
      `Edit ${testType} score for ${playerName}:`,
      currentScore.toString()
    );

    if (newScore && !isNaN(Number(newScore))) {
      const scoreValue = Number(newScore);

      if (onUpdateScore) {
        onUpdateScore(playerName, testType, scoreValue);
      } else {
        console.log(
          `Updating ${playerName}'s ${testType} from ${currentScore} to ${scoreValue}`
        );
        alert('Score update functionality not connected to data source');
      }
    }
  };
  return (
    <VStack align="stretch" gap={6}>
      <Table.ScrollArea>
        <Table.Root borderWidth={1} size={{ base: 'sm', md: 'md' }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                position="sticky"
                left={0}
                backgroundColor="white"
                zIndex={1}
                borderRight="1px solid"
                borderColor="gray.200"
                minWidth="150px"
              >
                Player
              </Table.ColumnHeader>

              {allTestTypes.map((testType) => (
                <Table.ColumnHeader
                  key={testType}
                  textAlign="center"
                  backgroundColor={`${getCategoryColor(testType)}.25`}
                  minWidth="120px"
                >
                  <VStack gap={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {testType}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="normal">
                      ({testTypeUnits[testType]})
                    </Text>
                  </VStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <Table.Row key={player.player_name}>
                  <Table.Cell
                    fontWeight="medium"
                    position="sticky"
                    left={0}
                    backgroundColor="white"
                    zIndex={1}
                    borderRight="1px solid"
                    borderColor="gray.200"
                  >
                    {player.player_name}
                  </Table.Cell>

                  {allTestTypes.map((testType) => (
                    <Table.Cell
                      key={`${player.player_name}-${testType}`}
                      textAlign="center"
                      backgroundColor={`${getCategoryColor(testType)}.10`}
                    >
                      {
                        getScoreDisplay(
                          player.tests[testType],
                          player.player_name,
                          testType
                        ).element
                      }
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={allTestTypes.length + 1}>
                  <EmptyState
                    icon={<TrendingUp />}
                    title="No test data available"
                    description="Add test results to see the performance matrix"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      {/* Pagination - only arrows */}
      {totalPages > 1 && (
        <HStack justify="center" gap={4}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>

          <Text fontSize="sm" color="gray.600">
            Page {currentPage} of {totalPages}
          </Text>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
