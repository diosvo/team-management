'use client';

import { Badge } from '@chakra-ui/react';

import { DataTable, TableColumn } from '@/components/data-table';
import { User } from '@/drizzle/schema';
import { UserState } from '@/utils/enum';

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
    render: (value) => (value as Date)?.toLocaleDateString('vi-VN'),
  },
  {
    header: 'State',
    accessor: 'state',
    render: (value) => {
      const color =
        value === UserState.ACTIVE
          ? 'green'
          : value === UserState.TEMPORARILY_ABSENT
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
