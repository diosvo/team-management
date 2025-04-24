'use client';

import Image from 'next/image';
import { use, useTransition } from 'react';

import { Avatar, Circle, Float, HStack, Menu } from '@chakra-ui/react';
import { LogOut, UserIcon } from 'lucide-react';

import { useUser } from '@/hooks/use-user';
import HeaderLogo from '@assets/images/header-logo.png';

import { toaster } from '@/components/ui/toaster';
import { useDialog } from '@/contexts/dialog-context';
import { logout } from '@/features/user/actions/auth';
import { colorState } from '@/utils/helper';
import UserInfo from './user-info';

export default function Header() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  const { open, isOpen } = useDialog();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  if (!user) {
    toaster.error({
      title: 'Session has been expired',
      description: 'Please login again.',
    });
    return null;
  }

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
        <Menu.Trigger focusVisibleRing="none">
          <Avatar.Root variant="subtle" size="sm">
            <Avatar.Fallback name={user.name} />
            <Avatar.Image src={user.image as string} />
            <Float placement="bottom-end" offsetX="1" offsetY="1">
              <Circle
                size="8px"
                outline="0.2em solid"
                outlineColor="bg"
                bg={colorState(user.state)}
              />
            </Float>
          </Avatar.Root>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="user-info"
              _hover={{ cursor: 'pointer' }}
              onClick={() => open()}
            >
              <UserIcon size={14} />
              {user.name}
            </Menu.Item>

            <Menu.Separator />

            <Menu.Item
              value="logout"
              disabled={isPending}
              onClick={handleLogout}
              _hover={{ cursor: 'pointer' }}
            >
              <LogOut size={14} /> Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      {isOpen && <UserInfo user={user} />}
    </HStack>
  );
}
