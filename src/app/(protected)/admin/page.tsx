import { Box, Grid, GridItem, HStack, Tabs } from '@chakra-ui/react';
import { BookUser, Coffee, Settings2, Shield } from 'lucide-react';

import { getRoster } from '@/features/user/actions/user';

import AddUsers from './_components/add-users';
import BulkUserActions from './_components/bulk-user-actions';

export default async function AdminPage() {
  const roster = await getRoster();

  return (
    <Tabs.Root defaultValue="roster_management" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="roster_management">
          <BookUser size={16} />
          Roster Management
        </Tabs.Trigger>
        <Tabs.Trigger value="settings" disabled>
          <Settings2 size={16} />
          Settings
        </Tabs.Trigger>
        <Tabs.Trigger value="rules" disabled>
          <Shield size={16} />
          Rules
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="roster_management">
        <Grid templateColumns="6fr 4fr" gap={4} mt={4}>
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
              <AddUsers roster={roster} />
            </Box>
          </GridItem>
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
              <BulkUserActions roster={roster} />
            </Box>
          </GridItem>
        </Grid>
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
