'use client';

import { Badge } from '@chakra-ui/react';

import { DataTable, TableColumn } from '@/components/data-table';
import { User } from '@/drizzle/schema';

const columns: Array<TableColumn<User>> = [
  {
    header: 'Name',
    accessor: 'name',
  },
  {
    header: 'Email',
    accessor: 'email',
  },
  {
    header: 'DOB',
    accessor: 'dob',
  },
  {
    header: 'Join Date',
    accessor: 'join_date',
  },
  {
    header: 'State',
    accessor: 'state',
    render: (value) => {
      const color =
        value === 'ACTIVE'
          ? 'green'
          : value === 'TEMPORARILY_ABSENT'
          ? 'orange'
          : 'red';

      return (
        <Badge variant="surface" colorPalette={color}>
          {value as string}
        </Badge>
      );
    },
  },
];

export function RosterTable({ users }: { users: Array<User> }) {
  return <DataTable columns={columns} data={users} showPagination />;
}
