import { getRoster } from '@/features/user/actions/user';
import RosterActions from './_components/actions';
import { RosterTable } from './_components/table';
import { parseSearchParams } from './_helpers/parse-params';

export default async function RosterPage(props: {
  searchParams: Promise<{
    query: string;
    roles: string;
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
