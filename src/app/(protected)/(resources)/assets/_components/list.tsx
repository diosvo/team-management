import { Tabs } from '@chakra-ui/react';
import CategoryTable from './table';

export default function AssetList() {
  return (
    <Tabs.Root
      defaultValue="members"
      variant="plain"
      size={{ base: 'sm', md: 'md' }}
    >
      <Tabs.List backgroundColor="bg.muted" rounded="lg" p="1">
        <Tabs.Trigger value="members">Equipment</Tabs.Trigger>
        <Tabs.Trigger value="projects">Training</Tabs.Trigger>
        <Tabs.Trigger value="tasks">Accessories</Tabs.Trigger>
        <Tabs.Indicator rounded="md" />
      </Tabs.List>
      <Tabs.Content value="members">
        <CategoryTable />
      </Tabs.Content>
      <Tabs.Content value="projects">Manage your projects</Tabs.Content>
      <Tabs.Content value="tasks">
        Manage your tasks for freelancers
      </Tabs.Content>
    </Tabs.Root>
  );
}
