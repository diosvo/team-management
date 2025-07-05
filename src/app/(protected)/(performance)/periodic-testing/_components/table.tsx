'use client';

import { useMemo, useState } from 'react';

import { Table, Text, VStack } from '@chakra-ui/react';
import { TrendingUp } from 'lucide-react';

import Pagination from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Status } from '@/components/ui/status';
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

export default function PerformanceMatrixTable({
  testResults,
  searchTerm = '',
  onUpdateScore,
}: TestTypesOverviewProps) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
  });

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

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    return playerMatrix.filter((player) =>
      player.player_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [playerMatrix, searchTerm]);

  // Calculate the players to show for the current page
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(
    startIndex + pagination.pageSize,
    filteredPlayers.length
  );
  const currentData = filteredPlayers.slice(startIndex, endIndex);

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
      return 'gray.600';
    };

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
      } else {
        // For other counts, show whole number (no unit in cell)
        return Math.round(score).toString();
      }
    };

    const cellContent = (
      <Text
        textAlign="center"
        color={getScoreColor()}
        onClick={() => handleCellClick(playerName, testType, testData.score)}
      >
        {formatScore(testData.score, testData.unit, testData.value_type)}
      </Text>
      // </Text>
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
    <VStack align="stretch">
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          showColumnBorder
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                position="sticky"
                left={0}
                zIndex={1}
                backgroundColor="white"
              >
                Player
              </Table.ColumnHeader>

              {allTestTypes.map((type) => (
                <Table.ColumnHeader key={type} textAlign="center">
                  <Text>
                    {type}
                    <Text
                      as="span"
                      fontSize="xs"
                      color="GrayText"
                      marginLeft={1}
                      fontWeight="normal"
                    >
                      ({testTypeUnits[type]})
                    </Text>
                  </Text>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((player) => (
                <Table.Row key={player.player_name}>
                  <Table.Cell
                    position="sticky"
                    left={0}
                    zIndex={1}
                    backgroundColor="white"
                  >
                    {player.player_name}
                  </Table.Cell>

                  {allTestTypes.map((type) => (
                    <Table.Cell
                      key={`${player.player_name}-${type}`}
                      _hover={{
                        cursor: 'pointer',
                        backgroundColor: 'bg.muted',
                      }}
                    >
                      {
                        getScoreDisplay(
                          player.tests[type],
                          player.player_name,
                          type
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
                    description="Try adjusting your search"
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
          <Table.Footer>
            <Table.Row color="GrayText">
              <Table.Cell textAlign="center" colSpan={allTestTypes.length + 1}>
                <Status colorPalette="green">Increment</Status>
                <Status colorPalette="red" marginInline={4}>
                  Decrement
                </Status>
                <Status colorPalette="gray">Unchanged</Status>
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={filteredPlayers.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={({ page }) =>
          setPagination((prev) => ({ ...prev, page }))
        }
      />
    </VStack>
  );
}
