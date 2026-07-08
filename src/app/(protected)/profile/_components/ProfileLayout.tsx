'use client';

import type { User } from '@/drizzle/schema';
import { Center, Tabs, useBreakpointValue } from '@chakra-ui/react';
import AvatarUploadCard from './AvatarUploadCard';
import PersonalInfo from './PersonalInfo';
import TeamInfo from './TeamInfo';

export default function ProfileLayout({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const orientation = useBreakpointValue<'horizontal' | 'vertical'>({
    base: 'horizontal',
    md: 'vertical',
  });

  return (
    <Center>
      <Tabs.Root
        size={orientation === 'vertical' ? 'lg' : 'sm'}
        width={orientation === 'vertical' ? '50%' : '100%'}
        defaultValue="avatar"
        orientation={orientation}
      >
        <Tabs.List>
          <Tabs.Trigger value="avatar">Overview</Tabs.Trigger>
          <Tabs.Trigger value="personal-info">Personal</Tabs.Trigger>
          <Tabs.Trigger value="team-info">Team</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="avatar" flex="1">
          <AvatarUploadCard user={user} />
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
