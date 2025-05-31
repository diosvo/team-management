import { use } from 'react';

import { Grid, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';
import Visibility from '@/components/visibility';

import { getUser } from '@/features/user/actions/auth';
import { hasPermissions } from '@/utils/helper';

import PersonalInfo from './_components/personal-info';
import SystemInfo from './_components/system-info';
import TeamInfo from './_components/team-info';

export default function ProfilePage() {
  const userPromise = getUser();
  const user = use(userPromise);

  if (!user) {
    return null;
  }

  const { isAdmin } = hasPermissions(user.role);

  return (
    <VStack gap={6} align="stretch">
      <PageTitle>Profile Details</PageTitle>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <PersonalInfo user={user} />
        <TeamInfo user={user} />
      </Grid>

      <Visibility isVisible={isAdmin}>
        <SystemInfo user={user} />
      </Visibility>
    </VStack>
  );
}
