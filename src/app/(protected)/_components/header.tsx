import Image from 'next/image';

import { Avatar, HStack, Menu } from '@chakra-ui/react';

import HeaderLogo from '@assets/images/header-logo.png';
import { LogOut, User } from 'lucide-react';

export default function Header() {
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
            <Avatar.Fallback name="Diosvo" />
            <Avatar.Image src="https://picsum.photos/200" />
          </Avatar.Root>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="user">
              <User size={16} /> User
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
