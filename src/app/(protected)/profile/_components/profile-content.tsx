import { forbidden, notFound } from 'next/navigation';

import { Grid } from '@chakra-ui/react';

import Visibility from '@/components/visibility';

import { getUserById } from '@/features/user/db/user';
import { hasPermissions } from '@/utils/helper';

import PersonalInfo from './personal-info';
import SystemInfo from './system-info';
import TeamInfo from './team-info';

interface ProfileContentProps {
  userId: string;
  currentUser: any; // Replace with proper type
}

export default async function ProfileContent({
  userId,
  currentUser,
}: ProfileContentProps) {
  const { isAdmin, isPlayer, isGuest } = hasPermissions(currentUser.role);

  if (isGuest) {
    forbidden();
  }

  const user = await getUserById(userId);

  if (!user) {
    notFound();
  }

  const isOwnProfile = currentUser.user_id === user.user_id;
  const viewOnly = isPlayer && !isOwnProfile;

  return (
    <>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <PersonalInfo user={user} viewOnly={viewOnly} />
        <TeamInfo user={user} viewOnly={viewOnly} isOwnProfile={isOwnProfile} />
      </Grid>

      <Visibility isVisible={isAdmin}>
        <SystemInfo user={user} />
      </Visibility>
    </>
  );
}
