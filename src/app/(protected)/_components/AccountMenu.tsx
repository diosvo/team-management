'use client';

import { useRouter } from 'next/navigation';

import { Avatar, Circle, Float, Link, Menu, Portal } from '@chakra-ui/react';
import { LogOut, UserIcon } from 'lucide-react';

import authClient from '@/lib/auth-client';

import { LOGIN_PATH } from '@/routes';
import { colorState } from '@/utils/helper';

export default function AccountMenu() {
  const router = useRouter();

  const { data } = authClient.useSession();
  if (!data?.user) return null;

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.replace(LOGIN_PATH),
      },
    });
  }

  const user = data.user;

  return (
    <Menu.Root>
      <Menu.Trigger focusVisibleRing="none">
        <Avatar.Root variant="subtle" size={{ base: 'xs', md: 'sm', lg: 'md' }}>
          <Avatar.Fallback name={user.name} />
          <Avatar.Image src={user.image as string} />
          <Float placement="bottom-end" offsetX={1} offsetY={1}>
            <Circle
              size={2}
              outline="0.2em solid"
              outlineColor="bg"
              backgroundColor={colorState(user.state)}
            />
          </Float>
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="profile" _hover={{ cursor: 'pointer' }} asChild>
              <Link href={'/profile/' + user.id}>
                <UserIcon size={14} />
                {user.name}
              </Link>
            </Menu.Item>
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
