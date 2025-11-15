import { getRoster } from '@/actions/user';

import RosterActions from './_components/RosterActions';
import RosterTable from './_components/RosterTable';
import { parseSearchParams } from './_helpers/parse-params';

export default async function RosterPage(props: {
  searchParams: Promise<{
    query: string;
    role: string;
    state: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = parseSearchParams(
    Object.fromEntries(new URLSearchParams(searchParams))
  );
  const users = await getRoster(params);

  return (
    <>
      <RosterActions />
      <RosterTable users={users} />
    </>
  );
}
