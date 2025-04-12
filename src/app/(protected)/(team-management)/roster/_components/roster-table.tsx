'use client';

import { DataTable, TableColumn } from '@/components/data-table';
import { Box } from 'lucide-react';

const columns: TableColumn<any>[] = [
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

export function RosterTable({ users }: { users: any[] }) {
  return <DataTable columns={columns} data={users} showPagination />;
}
