'use client';

import { useState } from 'react';

import { Separator, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import TestingFilters from './_components/testing-filters';
import TestingStats from './_components/testing-stats';
import TestingTable from './_components/testing-table';

// Mock data - in a real app, this would come from your database
const mockStats = {
  total_players: 24,
  completed_tests: 18,
  average_score: 78.5,
  improvement_rate: 12.3,
  pending_tests: 6,
  overdue_tests: 2,
  top_performers: 8,
  next_test_in_days: 14,
};

const mockTestResults = [
  {
    test_id: '1',
    player_name: 'John Smith',
    test_type: 'Sprint Speed',
    test_date: '2024-06-15',
    score: 85.2,
    previous_score: 82.1,
    status: 'completed' as const,
    notes: 'Excellent improvement in acceleration',
  },
  {
    test_id: '2',
    player_name: 'Mike Johnson',
    test_type: 'Endurance',
    test_date: '2024-06-14',
    score: 78.9,
    previous_score: 75.4,
    status: 'completed' as const,
    notes: 'Good progress, maintain training intensity',
  },
  {
    test_id: '3',
    player_name: 'Alex Brown',
    test_type: 'Vertical Jump',
    test_date: '2024-06-16',
    score: 88.1,
    previous_score: 86.7,
    status: 'completed' as const,
  },
  {
    test_id: '4',
    player_name: 'Sarah Davis',
    test_type: 'Agility',
    test_date: '2024-06-18',
    score: 0,
    status: 'pending' as const,
    notes: 'Scheduled for completion',
  },
  {
    test_id: '5',
    player_name: 'Tom Wilson',
    test_type: 'Free Throw %',
    test_date: '2024-06-10',
    score: 0,
    status: 'overdue' as const,
    notes: 'Needs immediate attention',
  },
];

export default function BiMonthlyTestingPage() {
  const [filteredResults, setFilteredResults] = useState(mockTestResults);

  const handleFilterChange = (filters: {
    search: string;
    testType: string;
    status: string;
    dateRange: string;
  }) => {
    let filtered = [...mockTestResults];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        (result) =>
          result.player_name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          result.test_type.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply test type filter
    if (filters.testType && filters.testType !== 'all') {
      const typeMap: Record<string, string[]> = {
        physical: ['Sprint Speed', 'Endurance', 'Vertical Jump', 'Agility'],
        skills: [
          'Free Throw %',
          'Three Point %',
          'Field Goal %',
          'Ball Handling',
        ],
        tactical: ['Game IQ', 'Decision Making', 'Team Play', 'Defense'],
        endurance: ['Endurance'],
      };

      const typesToInclude = typeMap[filters.testType] || [];
      if (typesToInclude.length > 0) {
        filtered = filtered.filter((result) =>
          typesToInclude.includes(result.test_type)
        );
      }
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((result) => result.status === filters.status);
    }

    // Apply date range filter (simplified implementation)
    // In a real app, you would parse the dates and apply proper filtering

    setFilteredResults(filtered);
  };

  return (
    <VStack align="stretch" gap={6}>
      <PageTitle>Bi-monthly Testing</PageTitle>

      <TestingStats stats={mockStats} />

      <Separator />

      <Separator />

      <TestingFilters onFilterChange={handleFilterChange} />

      <TestingTable testResults={filteredResults} />
    </VStack>
  );
}
