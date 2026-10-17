'use client';

import { Center, Tabs, useBreakpointValue } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import type { User } from '@/drizzle/schema';

import AvatarUploader from './AvatarUploader';
import PersonalInfo from './PersonalInfo';
import TeamInfo from './TeamInfo';

export default function ProfileLayout({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const t = useTranslations('profile.tabs');
  const orientation = useBreakpointValue<'horizontal' | 'vertical'>({
    base: 'horizontal',
    md: 'vertical',
  });

  return (
    <Center>
      <Tabs.Root
        size={orientation === 'vertical' ? 'lg' : 'sm'}
        width={{ base: 'full', xl: '3/4' }}
        maxWidth="5xl"
        defaultValue="avatar"
        orientation={orientation}
      >
        <Tabs.List>
          <Tabs.Trigger value="avatar">{t('overview')}</Tabs.Trigger>
          <Tabs.Trigger value="personal-info">{t('personal')}</Tabs.Trigger>
          <Tabs.Trigger value="team-info">{t('team')}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="avatar" flex="1">
          <AvatarUploader user={user} />
        </Tabs.Content>

        <Tabs.Content value="personal-info" flex="1">
          <PersonalInfo user={user} viewOnly={viewOnly} />
        </Tabs.Content>

        <Tabs.Content value="team-info" flex="1">
          <TeamInfo user={user} viewOnly={viewOnly} />
        </Tabs.Content>
      </Tabs.Root>
    </Center>
  );
}
