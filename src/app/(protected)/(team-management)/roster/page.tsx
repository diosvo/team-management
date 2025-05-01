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
  const emailExists = [
    'vtmn1212@gmail.com',
    ...users.map((user) => user.email),
  ];

  return (
    <>
      <RosterActions emailExists={emailExists} />
      <RosterTable users={users} />
    </>
  );
}
