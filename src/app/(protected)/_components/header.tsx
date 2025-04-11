'use client';

import Image from 'next/image';
import { use } from 'react';

import { Avatar, HStack, Menu } from '@chakra-ui/react';

import { useUser } from '@/hooks/use-user';
import HeaderLogo from '@assets/images/header-logo.png';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  return (
    <HStack align="center" justify="space-between" py="2" px="4">
      <Image
        priority
        width={192}
        quality={100}
        placeholder="blur"
        src={HeaderLogo}
        alt="Text Logo"
      />

      <Menu.Root>
        <Menu.Trigger>
          <Avatar.Root variant="subtle" size="sm">
            <Avatar.Fallback name={user?.name} />
            <Avatar.Image src={user?.image as string} />
          </Avatar.Root>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="user">
              <User size={16} /> {user?.name}
            </Menu.Item>

            <Menu.Separator />

            <Menu.Item value="logout">
              <LogOut size={16} /> Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    </HStack>
  );
}
