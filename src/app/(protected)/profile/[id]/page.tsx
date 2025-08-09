import { Metadata } from 'next';
import { forbidden, notFound, redirect } from 'next/navigation';

import { Grid, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';
import Visibility from '@/components/visibility';

import { LOGIN_PATH } from '@/routes';
import { hasPermissions } from '@/utils/helper';

import { getUser } from '@/features/user/actions/auth';
import { getUserById } from '@/features/user/actions/user';

import PersonalInfo from '../_components/personal-info';
import SystemInfo from '../_components/system-info';
import TeamInfo from '../_components/team-info';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and edit your profile details.',
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getUser();
  if (!currentUser) redirect(LOGIN_PATH);

  const { id } = await params;

  const { isAdmin, isPlayer, isGuest } = hasPermissions(currentUser.role);
  if (isGuest) forbidden();

  const user = await getUserById(id);
  if (!user) notFound();

  const isOwnProfile = currentUser.user_id === user.user_id;
  const viewOnly = isPlayer && !isOwnProfile;

  return (
    <VStack gap={6} alignItems="stretch">
      <PageTitle>Profile Details</PageTitle>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <PersonalInfo user={user} viewOnly={viewOnly} />
        <TeamInfo user={user} viewOnly={viewOnly} isOwnProfile={isOwnProfile} />
      </Grid>

      <Visibility isVisible={isAdmin}>
        <SystemInfo user={user} />
      </Visibility>
    </VStack>
  );
}
