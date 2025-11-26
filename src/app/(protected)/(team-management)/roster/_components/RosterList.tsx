'use client';

import { User } from '@/drizzle/schema';

import RosterFilters from './RosterFilters';
import RosterTable from './RosterTable';

import { useRosterFilters } from '../search-params';

export default function RosterList({ users }: { users: Array<User> }) {
  const [{ q, state, role }] = useRosterFilters();

  const filteredData = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(q.toLowerCase()) ||
      user.email.toLowerCase().includes(q.toLowerCase());
    const matchesState = state.length === 0 || state.includes(user.state);
    const matchesRole = role.length === 0 || role.includes(user.role);

    return matchesSearch && matchesState && matchesRole;
  });

  return (
    <>
      <RosterFilters />
      <RosterTable users={filteredData} />
    </>
  );
}
