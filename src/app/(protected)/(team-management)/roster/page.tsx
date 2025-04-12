'use client';

import { DataTable, TableColumn } from '@/components/data-table';
import { Box, Heading } from '@chakra-ui/react';

interface TeamMember {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  joinDate: string;
  status: 'Active' | 'Injured' | 'Suspended';
}

// Sample data for demonstration
const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    jerseyNumber: '10',
    position: 'Forward',
    joinDate: '2022-05-15',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    jerseyNumber: '7',
    position: 'Midfielder',
    joinDate: '2021-08-22',
    status: 'Injured',
  },
  {
    id: '3',
    name: 'Alex Johnson',
    jerseyNumber: '5',
    position: 'Defender',
    joinDate: '2023-01-10',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Sam Wilson',
    jerseyNumber: '1',
    position: 'Goalkeeper',
    joinDate: '2022-11-05',
    status: 'Suspended',
  },
];

export default function RosterPage() {
  const columns: TableColumn<TeamMember>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Jersey #',
      accessor: 'jerseyNumber',
    },
    {
      header: 'Position',
      accessor: 'position',
    },
    {
      header: 'Join Date',
      accessor: 'joinDate',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const color =
          value === 'Active'
            ? 'green.500'
            : value === 'Injured'
            ? 'orange.500'
            : 'red.500';

        return (
          <Box color={color} fontWeight="medium">
            {value}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Heading as="h1" size="xl" mb={4}>
        Team Roster
      </Heading>

      <DataTable columns={columns} data={teamMembers} showPagination />
    </Box>
  );
}
