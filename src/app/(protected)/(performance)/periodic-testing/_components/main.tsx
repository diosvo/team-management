'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createTestResult } from '@/features/periodic-testing/actions/test-result';
import { getAllMappings } from '@/features/periodic-testing/actions/test-type';
import {
  InitialData,
  MappingData,
  TestResultData,
  TransformedTestResult,
} from '@/features/periodic-testing/interfaces';
import {
  findTestTypeIdByName,
  findUserIdByName,
} from '@/features/periodic-testing/utils/mapping-helpers';
import { calculateDaysUntilNextTest } from '@/utils/date-helpers';
import { useTestResultsStorage } from '../_hooks/use-test-results';
import TestingFilters from './filters';
import TestingStats from './stats';
import PlayerPerformanceMatrix from './table';

interface Props {
  initialData: InitialData;
}

export default function PeriodicTestingPageClient({ initialData }: Props) {
  // Memoized calculation for next test date
  const nextTestInDays = useMemo(() => {
    return calculateDaysUntilNextTest();
  }, []); // Empty dependency array since calculation is based on current date

  const [testResults, setTestResults] = useState<TransformedTestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<
    TransformedTestResult[]
  >([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total_players: 0,
    completed_tests: 0,
    next_test_in_days: 0, // Will be set correctly in useEffect
  });
  const [testTypes, setTestTypes] = useState<string[]>([]);
  const [mappings, setMappings] = useState<MappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mappingsLoading, setMappingsLoading] = useState(true);
  const { getPendingResults, clearPendingResults } = useTestResultsStorage();

  // Transform database results to component format - Memoized
  const transformResults = useCallback((dbResults: TestResultData[]) => {
    return dbResults.map((result, index) => ({
      test_id: result.result_id || index.toString(),
      player_name: result.user_name || 'Unknown Player',
      test_type: result.test_type_name || 'Unknown Test',
      score: parseFloat(result.result),
      previous_score: undefined, // Would need additional logic to calculate
      notes: '', // Could be added to database schema
      unit: result.unit,
      value_type: result.unit === 'seconds' ? 'time' : 'count',
    }));
  }, []);

  // Initialize state with server-provided data and fetch mappings
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Transform initial test results
        const transformed = transformResults(initialData.testResults);
        setTestResults(transformed);
        setFilteredResults(transformed);

        // Calculate initial stats
        const uniquePlayers = new Set(transformed.map((r) => r.player_name));
        setStats({
          total_players: uniquePlayers.size,
          completed_tests: transformed.length,
          next_test_in_days: nextTestInDays,
        });

        // Set test types
        setTestTypes(initialData.testTypes.map((t) => t.name));

        // Set initial loading to false since basic data is ready
        setLoading(false);

        // Fetch mappings in the background using server action
        setMappingsLoading(true);
        const mappings = await getAllMappings();

        // Store mappings
        setMappings(mappings);

        setMappingsLoading(false);
      } catch (error) {
        console.error('Error initializing component:', error);
        setLoading(false);
        setMappingsLoading(false);
      }
    };

    initializeComponent();
  }, [initialData, transformResults, nextTestInDays]);

  // Memoized calculation of unique players and stats
  const calculatedStats = useMemo(() => {
    const uniquePlayers = new Set(testResults.map((r) => r.player_name));
    return {
      total_players: uniquePlayers.size,
      completed_tests: testResults.length,
      next_test_in_days: nextTestInDays,
    };
  }, [testResults, nextTestInDays]);

  // Update stats when testResults change
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  const handleAddMultipleResults = useCallback(
    async (
      newResults: {
        player_name: string;
        test_type: string;
        score: number;
        notes?: string;
      }[]
    ) => {
      try {
        if (!mappings) {
          console.error('Mappings not loaded yet');
          return;
        }

        const createdResults: TransformedTestResult[] = [];

        for (const result of newResults) {
          const userId = findUserIdByName(result.player_name, mappings.users);
          const typeId = findTestTypeIdByName(
            result.test_type,
            mappings.testTypes
          );

          if (userId && typeId) {
            // Create the test result in the database
            const response = await createTestResult(
              userId,
              typeId,
              result.score.toString(),
              new Date()
            );

            if (!response.error) {
              createdResults.push({
                test_id: `${Date.now()}-${createdResults.length}`,
                ...result,
                previous_score: undefined,
                unit: 'points',
                value_type: 'count',
              });
            }
          } else {
            console.warn(
              `Could not find mapping for player: ${result.player_name} or test type: ${result.test_type}`
            );
            // Still add to UI for immediate feedback
            createdResults.push({
              test_id: `temp-${Date.now()}-${createdResults.length}`,
              ...result,
              previous_score: undefined,
              unit: 'points',
              value_type: 'count',
            });
          }
        }

        setTestResults([...testResults, ...createdResults]);
        setFilteredResults([...filteredResults, ...createdResults]);

        // Update stats
        const allResults = [...testResults, ...createdResults];
        const uniquePlayers = new Set(allResults.map((r) => r.player_name));
        setStats((prev) => ({
          ...prev,
          total_players: uniquePlayers.size,
          completed_tests: allResults.length,
        }));
      } catch (error) {
        console.error('Error adding test results:', error);
      }
    },
    [mappings, testResults, filteredResults]
  ); // Dependencies for useCallback

  // Load test results from storage on component mount
  useEffect(() => {
    const loadPendingResults = async () => {
      const pendingResults = getPendingResults();
      if (pendingResults && pendingResults.length > 0 && mappings) {
        await handleAddMultipleResults(pendingResults);
        clearPendingResults();
      }
    };

    loadPendingResults();
  }, [
    mappings,
    handleAddMultipleResults,
    getPendingResults,
    clearPendingResults,
  ]); // Run when mappings are loaded

  const handleFilterChange = useCallback(
    (filters: { search: string; dateRange: string }) => {
      let filtered = [...testResults];

      setCurrentSearchTerm(filters.search);

      // Apply search filter
      if (filters.search) {
        filtered = filtered.filter(
          (result) =>
            result.player_name
              .toLowerCase()
              .includes(filters.search.toLowerCase()) ||
            result.test_type
              .toLowerCase()
              .includes(filters.search.toLowerCase())
        );
      }

      setFilteredResults(filtered);
    },
    [testResults]
  ); // Dependencies for useCallback

  const handleAddTestResult = useCallback(
    async (newResult: {
      player_name: string;
      test_type: string;
      score: number;
      notes?: string;
    }) => {
      try {
        if (!mappings) {
          console.error('Mappings not loaded yet');
          return;
        }

        const userId = findUserIdByName(newResult.player_name, mappings.users);
        const typeId = findTestTypeIdByName(
          newResult.test_type,
          mappings.testTypes
        );

        if (userId && typeId) {
          // Create the test result in the database
          const response = await createTestResult(
            userId,
            typeId,
            newResult.score.toString(),
            new Date()
          );

          if (!response.error) {
            const testResult = {
              test_id: `${Date.now()}`,
              ...newResult,
              previous_score: undefined,
              unit: 'points',
              value_type: 'count',
            };

            setTestResults([...testResults, testResult]);
            setFilteredResults([...filteredResults, testResult]);

            // Update stats
            const allResults = [...testResults, testResult];
            const uniquePlayers = new Set(allResults.map((r) => r.player_name));
            setStats((prev) => ({
              ...prev,
              total_players: uniquePlayers.size,
              completed_tests: allResults.length,
            }));
          } else {
            console.error('Failed to create test result:', response.error);
          }
        } else {
          console.warn(
            `Could not find mapping for player: ${newResult.player_name} or test type: ${newResult.test_type}`
          );
        }
      } catch (error) {
        console.error('Error adding test result:', error);
      }
    },
    [mappings, testResults, filteredResults]
  ); // Dependencies for useCallback

  const handleUpdateScore = useCallback(
    async (playerName: string, testType: string, newScore: number) => {
      try {
        // Find the test result in our local state
        const resultIndex = testResults.findIndex(
          (result) =>
            result.player_name === playerName && result.test_type === testType
        );

        if (resultIndex !== -1) {
          const testResult = testResults[resultIndex];

          // If it's a real database result (not a temporary one), update in database
          if (!testResult.test_id.startsWith('temp-')) {
            // In a real implementation, you would:
            // 1. Find the actual result_id from the database
            // 2. Update using editTestResult action

            // For now, just update locally
            console.log('Would update test result in database:', {
              result_id: testResult.test_id,
              newScore,
            });
          }

          // Update local state
          const updatedResults = [...testResults];
          updatedResults[resultIndex].score = newScore;
          setTestResults(updatedResults);

          const filteredIndex = filteredResults.findIndex(
            (result) =>
              result.player_name === playerName && result.test_type === testType
          );

          if (filteredIndex !== -1) {
            const newFilteredResults = [...filteredResults];
            newFilteredResults[filteredIndex] = {
              ...updatedResults[resultIndex],
            };
            setFilteredResults(newFilteredResults);
          }
        }
      } catch (error) {
        console.error('Error updating test result:', error);
      }
    },
    [testResults, filteredResults]
  ); // Dependencies for useCallback

  if (loading) {
    return <div>Loading test results...</div>;
  }

  return (
    <>
      <TestingStats stats={stats} />

      {mappingsLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
          Loading player and test type mappings...
        </div>
      ) : (
        <TestingFilters
          onFilterChange={handleFilterChange}
          onAddResult={handleAddTestResult}
          onAddMultipleResults={handleAddMultipleResults}
          usedTestTypes={testTypes}
        />
      )}

      <PlayerPerformanceMatrix
        testResults={filteredResults}
        searchTerm={currentSearchTerm}
        onUpdateScore={handleUpdateScore}
      />
    </>
  );
}
