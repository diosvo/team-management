import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

import AddUser from './AddUser';

export default function RosterHeader() {
  return (
    <PageHeader title="Team Roster">
      <Authorized resource="roster" action="create">
        <AddUser />
      </Authorized>
    </PageHeader>
  );
}
