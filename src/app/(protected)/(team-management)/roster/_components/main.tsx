import { getRoster } from '@/features/user/actions/user';
import { FilterUsersValues } from '@/features/user/schemas/user';

import RosterActions from './actions';
import { RosterTable } from './table';

export default async function RosterMain({
  params,
}: {
  params: FilterUsersValues;
}) {
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
