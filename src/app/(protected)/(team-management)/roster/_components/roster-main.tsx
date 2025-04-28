import { getRoster } from '@/features/user/actions/user';
import { RosterTable } from './roster-table';

export default async function RosterMain({ query }: { query: string }) {
  const users = await getRoster(query);

  return <RosterTable users={users} />;
}
