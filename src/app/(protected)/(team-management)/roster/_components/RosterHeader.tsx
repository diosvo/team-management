import { HStack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import Authorized from '@/components/Authorized';
import AddUser from './AddUser';

export default function RosterHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Team Roster" />
      <Authorized resource="roster" action="create">
        <AddUser />
      </Authorized>
    </HStack>
  );
}
