import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Text } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

import { getUserProfile } from '@/actions/user';
import { formatDatetime } from '@/utils/datetime';

import ProfileLayout from '../_components/ProfileLayout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ targetUser, viewOnly }, t] = await Promise.all([
    getUserProfile(id),
    getTranslations('profile'),
  ]);

  return (
    <>
      <PageTitle title={t('title')} />
      <ProfileLayout user={targetUser} viewOnly={viewOnly} />
      <Text fontSize="sm" color="GrayText">
        {t('lastUpdated', { date: formatDatetime(targetUser.updatedAt) })}
      </Text>
    </>
  );
}
