import { HStack, Tabs } from '@chakra-ui/react';
import { BookUser, Coffee, Settings2, Shield } from 'lucide-react';

import AddUsers from './_components/add-users';

export default function UserManagementPage() {
  return (
    <Tabs.Root defaultValue="add_users" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="add_users">
          <BookUser size={16} />
          Add users
        </Tabs.Trigger>
        <Tabs.Trigger value="settings">
          <Settings2 size={16} />
          Settings
        </Tabs.Trigger>
        <Tabs.Trigger value="rules">
          <Shield size={16} />
          Rules
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="add_users">
        <AddUsers />
      </Tabs.Content>
      <Tabs.Content value="settings">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
      <Tabs.Content value="rules">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
    </Tabs.Root>
  );
}
