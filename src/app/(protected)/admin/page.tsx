import { Metadata } from 'next';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';

import { Box, Grid, GridItem, HStack, Tabs } from '@chakra-ui/react';
import { BookUser, Coffee, Film, Package } from 'lucide-react';

import { getUser } from '@/features/user/actions/auth';
import { getRoster } from '@/features/user/actions/user';
import { UserRole } from '@/utils/enum';

import AddUsers from './_components/add-users';
import BulkUserActions from './_components/bulk-user-actions';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Only visible to SUPER_ADMIN',
};

export default async function AdminPage() {
  const roster = await getRoster();
  const user = await getUser();

  if (!user?.roles.includes(UserRole.SUPER_ADMIN)) {
    forbidden();
  }

  return (
    <Tabs.Root defaultValue="roster_management" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="roster_management">
          <BookUser size={16} />
          Roster Management
        </Tabs.Trigger>
        <Tabs.Trigger value="equipment" disabled>
          <Package size={16} />
          Equipment
        </Tabs.Trigger>
        <Tabs.Trigger value="documents" disabled>
          <Film size={16} />
          Documents
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="roster_management">
        <Grid templateColumns="6fr 4fr" gap={4} mt={4}>
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
              <Suspense fallback={<div>Loading...</div>}>
                <AddUsers roster={roster} />
              </Suspense>
            </Box>
          </GridItem>
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
              <Suspense fallback={<div>Loading...</div>}>
                <BulkUserActions roster={roster} />
              </Suspense>
            </Box>
          </GridItem>
        </Grid>
      </Tabs.Content>
      <Tabs.Content value="equipment">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
      <Tabs.Content value="documents">
        <HStack justifyContent="center">
          <Coffee size={16} />
          The feature will be available soon.
        </HStack>
      </Tabs.Content>
    </Tabs.Root>
  );
}
