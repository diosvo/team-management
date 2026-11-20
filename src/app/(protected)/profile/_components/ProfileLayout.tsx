'use client';

import { SimpleGrid, VStack } from '@chakra-ui/react';

import type { User } from '@/drizzle/schema';

import PersonalInfo from './PersonalInfo';
import ProfileHeader from './ProfileHeader';
import TeamInfo from './TeamInfo';

/**
 * One page instead of tabs: the header carries the key facts, the two detail
 * cards sit side by side from `lg` and stack on smaller screens.
 */
export default function ProfileLayout({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  return (
    <VStack
      alignItems="stretch"
      gap={4}
      width="full"
      maxWidth="5xl"
      marginInline="auto"
    >
      <ProfileHeader user={user} viewOnly={viewOnly} />
      {/* Rows stretch, so side-by-side cards share the taller one's height. */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <PersonalInfo user={user} viewOnly={viewOnly} />
        <TeamInfo user={user} viewOnly={viewOnly} />
      </SimpleGrid>
    </VStack>
  );
}
