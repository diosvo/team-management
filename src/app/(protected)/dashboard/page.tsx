'use client';

import { useSession } from 'next-auth/react';
import { useTransition } from 'react';

import { Avatar, Button, Card } from '@chakra-ui/react';

import LogoutButton from '@/app/(auth)/_components/logout-button';
import { toaster } from '@/components/ui/toaster';
import useCurrentUser from '@/hooks/use-current-user';

import { settings } from '@/features/user/actions/settings';

export default function DashboardPage() {
  const user = useCurrentUser();
  const { update } = useSession();

  const [isPending, startTransition] = useTransition();

  const onSettings = () => {
    startTransition(() => {
      settings({
        name: 'Dios Vo!',
      }).then(({ error, message }) => {
        toaster.create({
          description: message,
          type: error ? 'error' : 'info',
        });

        if (!error) update();
      });
    });
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
      <Card.Root width="320px">
        <Card.Body gap="2">
          <Avatar.Root size="lg" shape="rounded">
            <Avatar.Image src="https://picsum.photos/200" />
            <Avatar.Fallback name="SGR" />
          </Avatar.Root>
          <Card.Title mt="2">{user.name}</Card.Title>
          <Card.Description>{user.id}</Card.Description>
        </Card.Body>
        <Card.Footer justifyContent="flex-end">
          <Button onClick={onSettings} loading={isPending}>
            Settings
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>
  );
}
