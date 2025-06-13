import { forbidden, notFound } from 'next/navigation';

import { Grid } from '@chakra-ui/react';

import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { getUserById } from '@/features/user/db/user';
import { hasPermissions } from '@/utils/helper';

import PersonalInfo from './personal-info';
import SystemInfo from './system-info';
import TeamInfo from './team-info';

export default async function ProfileContent({
  user_id,
  current_user,
}: {
  user_id: string;
  current_user: User;
}) {
  const { isAdmin, isPlayer, isGuest } = hasPermissions(current_user.role);

  if (isGuest) {
    forbidden();
  }

  const user = await getUserById(user_id);

  if (!user) {
    notFound();
  }

  const isOwnProfile = current_user.user_id === user.user_id;
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
