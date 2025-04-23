'use client';

import { Badge } from '@chakra-ui/react';

import { DataTable, TableColumn } from '@/components/data-table';
import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';
import { colorState } from '@/utils/helper';

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
    render: (value) => formatDate(value as Date),
  },
  {
    header: 'Join Date',
    accessor: 'join_date',
    render: (value) => formatDate(value as Date),
  },
  {
    header: 'State',
    accessor: 'state',
    render: (value) => {
      const state = value as string;

      return (
        <Badge variant="surface" colorPalette={colorState(state)}>
          {state}
        </Badge>
      );
    },
  },
];

export function RosterTable({ users }: { users: Array<User> }) {
  return <DataTable columns={columns} data={users} showPagination />;
}
