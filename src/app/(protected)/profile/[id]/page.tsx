import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Grid, Skeleton, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';

import { LOGIN_PATH } from '@/routes';

import { getUser } from '@/features/user/actions/auth';

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

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent userId={id} currentUser={currentUser} />
      </Suspense>
    </VStack>
  );
}

function ProfileSkeleton() {
  return (
    <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
      <Skeleton height="300px" borderRadius="md" />
      <Skeleton height="200px" borderRadius="md" />
    </Grid>
  );
}
