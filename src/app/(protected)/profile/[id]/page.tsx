import { Metadata } from 'next';

import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { getUserProfile } from '@/actions/user';
import { formatDatetime } from '@/utils/formatter';

import PersonalInfo from '../_components/PersonalInfo';
import TeamInfo from '../_components/TeamInfo';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and edit your profile details.',
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { targetUser, viewOnly } = await getUserProfile(id);

  return (
    <VStack gap={6} alignItems="stretch">
      <PageTitle>Profile Details</PageTitle>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <PersonalInfo user={targetUser} viewOnly={viewOnly} />
        <TeamInfo user={targetUser} viewOnly={viewOnly} />
      </SimpleGrid>

      <Text fontSize="xs" color="GrayText">
        {`Last updated on ${formatDatetime(targetUser.updatedAt)}`}
      </Text>
    </VStack>
  );
}
