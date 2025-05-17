'use client';

import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { use, useEffect, useState, useTransition } from 'react';

import {
  Avatar,
  Circle,
  Drawer,
  Float,
  HStack,
  IconButton,
  Image,
  Menu,
  Portal,
} from '@chakra-ui/react';
import { LogOut, PanelRightOpen, UserIcon } from 'lucide-react';

import { logout } from '@/features/user/actions/auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useUser } from '@/hooks/use-user';

import { colorState } from '@/utils/helper';
import HeaderLogo from '@assets/images/header-logo.png';

import { CloseButton } from '@/components/ui/close-button';
import { dialog } from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';

import Sidebar from './sidebar';
import UserInfo from './user-info';

export default function Header() {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const { isAdmin } = usePermissions();

  const pathname = usePathname();

  const [open, setOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <HStack align="center" paddingBlock={2} paddingInline={4}>
      <Image
        width={{ base: 132, sm: 144, md: 192 }}
        marginRight="auto"
        alt="Text Logo"
        asChild
      >
        <NextImage
          priority
          quality={100}
          placeholder="blur"
          src={HeaderLogo}
          alt="Text Logo"
        />
      </Image>

      <Menu.Root>
        <Menu.Trigger focusVisibleRing="none">
          <Avatar.Root variant="subtle" size={{ base: 'xs', md: 'sm' }}>
            <Avatar.Fallback name={user.name} />
            <Avatar.Image src={user.image as string} />
            <Float placement="bottom-end" offsetX={1} offsetY={1}>
              <Circle
                size={2}
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
              onClick={() =>
                dialog.open('profile', {
                  children: <UserInfo user={user} isAdmin={isAdmin} />,
                })
              }
            >
              <UserIcon size={14} />
              {user.name}
            </Menu.Item>

            <Menu.Separator />

            <Menu.Item
              value="logout"
              disabled={isPending}
              _hover={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              <LogOut size={14} /> Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      <Drawer.Root open={open} onOpenChange={({ open }) => setOpen(open)}>
        <Drawer.Trigger asChild>
          <IconButton hideFrom="lg" size="sm" variant="outline" rounded="full">
            <PanelRightOpen />
          </IconButton>
        </Drawer.Trigger>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxWidth="224px">
              <Drawer.Body padding={0}>
                <Sidebar />
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="2xs" rounded="full" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      <dialog.Viewport />
    </HStack>
  );
}
