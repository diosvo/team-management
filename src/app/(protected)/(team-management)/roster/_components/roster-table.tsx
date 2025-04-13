'use client';

import { Box } from 'lucide-react';

import { DataTable, TableColumn } from '@/components/data-table';
import { User } from '@/drizzle/schema';

const columns: TableColumn<User>[] = [
  {
    header: 'Name',
    accessor: 'name',
  },
  {
    header: 'Jersey #',
    accessor: 'jersey_number',
  },
  {
    header: 'DOB',
    accessor: 'dob',
  },
  {
    header: 'Join Date',
    accessor: 'join_date',
    render: (value: string) => new Date(value).toLocaleDateString(),
  },
  {
    header: 'Status',
    accessor: 'state',
    render: (value: string) => {
      const color =
        value === 'ACTIVE'
          ? 'green.500'
          : value === 'TEMPORARILY_ABSENT'
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

export function RosterTable({ users }: { users: Array<User> }) {
  return <DataTable columns={columns} data={users} showPagination />;
}
