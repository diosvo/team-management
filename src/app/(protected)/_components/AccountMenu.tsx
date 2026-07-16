'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Avatar,
  Circle,
  Float,
  Menu,
  Portal,
  SkeletonCircle,
} from '@chakra-ui/react';
import { GamepadDirectional, LogOut, UserRound } from 'lucide-react';

import { useUserAvatar } from '@/hooks/use-avatar';
import authClient from '@/lib/auth-client';
import { useSessionContext } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';
import { getColor } from '@/utils/helper';

export default function AccountMenu() {
  const router = useRouter();
  const { user, isAuthenticated } = useSessionContext();

  if (!isAuthenticated || !user) return null;

  const { data: image, isLoading } = useUserAvatar(user.image);

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.replace(LOGIN_PATH),
      },
    });
  }

  const Contents = [
    {
      title: 'Profile',
      icon: UserRound,
      href: '/profile',
    },
    {
      title: 'My Performance',
      icon: GamepadDirectional,
      href: '/performance',
    },
  ];

  return (
    <Menu.Root>
      <Menu.Trigger focusVisibleRing="none">
        {isLoading ? (
          <SkeletonCircle size="10" />
        ) : (
          <Avatar.Root
            variant="outline"
            size={{ base: 'xs', md: 'sm', lg: 'md' }}
          >
            <Avatar.Fallback name={user.name} />
            <Avatar.Image src={image ?? undefined} />
            <Float placement="bottom-end" offsetX={1} offsetY={1}>
              <Circle
                size={2}
                outline="0.2em solid"
                outlineColor="bg"
                backgroundColor={getColor(user.state)}
              />
            </Float>
          </Avatar.Root>
        )}
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {Contents.map(({ title, icon: Icon, href }) => (
              <Menu.Item
                key={href}
                value={href}
                _hover={{ cursor: 'pointer' }}
                asChild
              >
                <Link href={href + '/' + user.id}>
                  <Icon size={14} />
                  {title}
                </Link>
              </Menu.Item>
            ))}
            <Menu.Separator />
            <Menu.Item
              value="logout"
              _hover={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              <LogOut size={14} /> Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
