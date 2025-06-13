import { redirect } from 'next/navigation';

import { VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { getUser } from '@/features/user/actions/auth';
import { LOGIN_PATH } from '@/routes';

import ProfileContent from '../_components/profile-content';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getUser();

  if (!currentUser) {
    redirect(LOGIN_PATH);
  }

  const { id } = await params;

  return (
    <VStack gap={6} align="stretch">
      <PageTitle>Profile Details</PageTitle>
      <ProfileContent user_id={id} current_user={currentUser} />
    </VStack>
  );
}
