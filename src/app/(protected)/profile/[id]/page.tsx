import { Metadata } from 'next';

import { Text } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { getUserProfile } from '@/actions/user';
import { formatDatetime } from '@/utils/formatter';

import ProfileLayout from '../_components/ProfileLayout';

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
    <>
      <PageTitle title="Profile Details" />
      <ProfileLayout user={targetUser} viewOnly={viewOnly} />
      <Text fontSize="sm" color="GrayText">
        {`Last updated on ${formatDatetime(targetUser.updatedAt)}`}
      </Text>
    </>
  );
}
