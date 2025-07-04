'use client';

import { useState } from 'react';

import { VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import TestingFilters from './_components/filters';
import TestingStats from './_components/stats';
import PlayerPerformanceMatrix from './_components/table';

// Function to calculate next test date (every 2 months on the 25th)
const calculateNextTestDate = () => {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Test dates for 2025: Jan 25, Mar 25, May 25, Jul 25, Sep 25, Nov 25
  const testMonths = [0, 2, 4, 6, 8, 10]; // January, March, May, July, September, November

  let nextTestDate: Date;

  // Find the next test date
  for (const month of testMonths) {
    const testDate = new Date(currentYear, month, 25);

    if (testDate > now) {
      nextTestDate = testDate;
      break;
    }
  }

  // If no test date found in current year, use January 25 of next year
  if (!nextTestDate!) {
    nextTestDate = new Date(currentYear + 1, 0, 25); // January 25 of next year
  }

  // Calculate days difference
  const timeDiff = nextTestDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return daysDiff;
};

// Mock data - in a real app, this would come from your database
const mockStats = {
  total_players: 24,
  completed_tests: 18,
  next_test_in_days: calculateNextTestDate(),
};

// Create a mutable array for mock test results
const generateCompleteTestData = () => {
  const players = [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
    'Player 5',
    'Player 6',
    'Player 7',
    'Player 8',
    'Player 9',
    'Player 10',
    'Player 11',
    'Player 12',
    'Player 13',
    'Player 14',
    'Player 15',
    'Player 16',
  ];

  // Test types based on the real data from images
  const testTypes = [
    // Time-based tests (lower is better) - using exact data from images
    {
      name: 'Beep test',
      type: 'time',
      unit: 's',
      // January 25, 2025 data (first image)
      jan25Data: [
        8.2, 7.5, 7.6, 8.5, 8.1, 7.8, 8.7, 6.1, 6.1, 6.9, 7.4, 7.3, 8.7,
      ],
      // March 25, 2025 data (second image)
      mar25Data: [
        9.7, 10.1, 10.9, 11.3, 11.7, 9.8, 11.1, 12.2, 12.1, 8.9, 9.0, 9.6, 10.3,
        9.5, 11.7, 10.9,
      ],
    },
    {
      name: 'Plank',
      type: 'time',
      unit: 's',
      // January 25, 2025 data (first image) - convert from minutes to seconds
      jan25Data: [
        84.6, 126, 134.4, 72, 131.4, 74.4, 92.4, 154.8, 86.4, 66.6, 73.2, 73.2,
        90,
      ],
      // March 25, 2025 data - realistic improvement/regression from January
      mar25Data: [
        90, 130, 125, 80, 140, 78, 95, 160, 85, 70, 75, 80, 95, 88, 135, 82,
      ],
    },
    {
      name: 'Run n slide',
      type: 'time',
      unit: 's',
      // Only available in March 25, 2025 data (second image)
      jan25Data: [],
      mar25Data: [
        10.87, 11.07, 11.67, 10.54, 11.79, 11.79, 11.07, 11.67, 10.69, 11.8,
        11.47, 10.82, 12.7, 11.22, 10.74, 13.29,
      ],
    },

    // Count-based tests (higher is better)
    {
      name: 'Sit-ups',
      type: 'count',
      unit: 'reps',
      // January 25, 2025 data (first image)
      jan25Data: [50, 125, 100, 110, 46, 50, 92, 100, 71, 62, 100, 102, 83],
      // March 25, 2025 data (second image)
      mar25Data: [
        247, 200, 101, 150, 120, 80, 102, 105, 204, 100, 152, 202, 210, 190,
        172,
      ],
    },
    {
      name: 'Push-ups',
      type: 'count',
      unit: 'reps',
      // January 25, 2025 data (first image)
      jan25Data: [50, 61, 80, 35, 30, 45, 25, 45, 37, 20, 57, 47, 50],
      // March 25, 2025 data (second image)
      mar25Data: [
        80, 98, 120, 183, 120, 77, 113, 130, 146, 150, 110, 50, 120, 140, 105,
        105,
      ],
    },
  ];

  const results: Array<{
    test_id: string;
    player_name: string;
    test_type: string;
    score: number;
    previous_score?: number;
    notes?: string;
    unit: string;
    value_type: string;
  }> = [];
  let testId = 1;

  players.forEach((player, playerIndex) => {
    testTypes.forEach((testType) => {
      // Use real data from images, cycling through available data points
      const jan25Data = testType.jan25Data;
      const mar25Data = testType.mar25Data;

      // For January 25, 2025 data
      if (jan25Data.length > 0) {
        const jan25Score = jan25Data[playerIndex % jan25Data.length];

        results.push({
          test_id: testId.toString(),
          player_name: player,
          test_type: testType.name,
          score: jan25Score,
          previous_score: undefined, // No previous score for first test
          notes: 'Baseline test',
          unit: testType.unit,
          value_type: testType.type,
        });
        testId++;
      }

      // For March 25, 2025 data
      if (mar25Data.length > 0) {
        const mar25Score = mar25Data[playerIndex % mar25Data.length];
        const jan25Score =
          jan25Data.length > 0
            ? jan25Data[playerIndex % jan25Data.length]
            : undefined;

        // Calculate improvement note
        let notes = '';
        if (jan25Score !== undefined) {
          if (testType.type === 'time') {
            // For time-based, lower score is better
            notes =
              mar25Score < jan25Score ? 'Good improvement' : 'Needs focus';
          } else {
            // For others, higher score is better
            notes =
              mar25Score > jan25Score ? 'Good improvement' : 'Needs focus';
          }
        } else {
          notes = 'First measurement';
        }

        results.push({
          test_id: testId.toString(),
          player_name: player,
          test_type: testType.name,
          score: mar25Score,
          previous_score: jan25Score,
          notes: notes,
          unit: testType.unit,
          value_type: testType.type,
        });
        testId++;
      }
    });
  });

  return results;
};

const mockTestResults = generateCompleteTestData();

export default function PeriodicTestingPage() {
  const [filteredResults, setFilteredResults] = useState(mockTestResults);
  const [currentDateRange, setCurrentDateRange] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  const handleFilterChange = (filters: {
    search: string;
    dateRange: string;
  }) => {
    let filtered = [...mockTestResults];

    // Store the current search term
    setCurrentSearchTerm(filters.search);

    // Since we removed test_date, we don't filter by date anymore

    // Apply search filter
    let searchFiltered = [...filtered];
    if (filters.search) {
      searchFiltered = searchFiltered.filter(
        (result) =>
          result.player_name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          result.test_type.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Update current date range and recalculate stats
    setCurrentDateRange(filters.dateRange);

    // Pass filtered results to the matrix (it will handle search itself with the searchTerm)
    setFilteredResults(filtered);
  };

  const handleAddTestResult = (newResult: {
    player_name: string;
    test_type: string;
    score: number;
    notes?: string;
  }) => {
    const testResult = {
      test_id: (mockTestResults.length + 1).toString(),
      ...newResult,
      previous_score: undefined,
      unit: 'pts', // Default unit, should be determined by test type
      value_type: 'count', // Default type, should be determined by test type
    };

    // Add to mock data (in real app, this would be an API call)
    mockTestResults.push(testResult);
    setFilteredResults([...filteredResults, testResult]);
  };

  const handleUpdateScore = (
    playerName: string,
    testType: string,
    newScore: number
  ) => {
    // Find and update the test result in the mock data
    const resultIndex = mockTestResults.findIndex(
      (result) =>
        result.player_name === playerName && result.test_type === testType
    );

    if (resultIndex !== -1) {
      // Update the score in the original mock data
      mockTestResults[resultIndex].score = newScore;

      // Update the filtered results
      const newFilteredResults = [...filteredResults];
      const filteredIndex = newFilteredResults.findIndex(
        (result) =>
          result.player_name === playerName && result.test_type === testType
      );

      if (filteredIndex !== -1) {
        newFilteredResults[filteredIndex] = { ...mockTestResults[resultIndex] };
        setFilteredResults(newFilteredResults);
      }
    }
  };

  return (
    <VStack align="stretch">
      <PageTitle>Periodic Testing</PageTitle>

      <TestingStats stats={mockStats} />

      <TestingFilters
        onFilterChange={handleFilterChange}
        onAddResult={handleAddTestResult}
      />

      <PlayerPerformanceMatrix
        testResults={filteredResults}
        searchTerm={currentSearchTerm}
        onUpdateScore={handleUpdateScore}
      />
    </VStack>
  );
}
