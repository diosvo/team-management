import { HStack, Tabs } from '@chakra-ui/react';
import { BookUser, Coffee, Settings2, Shield } from 'lucide-react';
import AddUsers from './_components/add-users';

export default function UserManagementPage() {
  return (
    <Tabs.Root defaultValue="user_management" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="user_management">
          <BookUser size={16} />
          User Management
        </Tabs.Trigger>
        <Tabs.Trigger value="projects">
          <Settings2 size={16} />
          Settings
        </Tabs.Trigger>
        <Tabs.Trigger value="tasks">
          <Shield size={16} />
          Rules
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="user_management">
        <AddUsers />
      </Tabs.Content>
      <Tabs.Content value="projects">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
      <Tabs.Content value="tasks">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
    </Tabs.Root>
  );
}
