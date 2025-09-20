import { Metadata } from 'next';

import { Grid, Text, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { getProfilePermission } from '@/features/user/actions/user';
import { formatDatetime } from '@/utils/formatter';
import PersonalInfo from '../_components/personal-info';
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
  const { id } = await params;
  const { viewOnly, isOwnProfile, lastUpdated } = await getProfilePermission(
    id
  );

  return (
    <VStack gap={6} alignItems="stretch">
      <PageTitle>Profile Details</PageTitle>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <PersonalInfo viewOnly={viewOnly} />
        <TeamInfo viewOnly={viewOnly} isOwnProfile={isOwnProfile} />
      </Grid>

      <Text fontSize="xs" color="GrayText">
        {`Last updated on ${formatDatetime(lastUpdated)}`}
      </Text>
    </VStack>
  );
}
