'use client';

import { useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { Avatar, Button, Card, Text } from '@chakra-ui/react';

import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';

import LogoutButton from '@/app/(auth)/_components/logout-button';
import { settings } from '@/features/user/actions/settings';
import useCurrentUser from '@/hooks/use-current-user';

const roles = [
  { label: 'Coach', value: 'a' },
  { label: 'Captain', value: 'b' },
  { label: 'Player', value: 'c' },
  { label: 'Guest', value: 'd' },
];

export default function DashboardPage() {
  const user = useCurrentUser();
  const { update } = useSession();

  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(false);

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

      <Text fontWeight="medium" mt="4">
        Admin Only
      </Text>

      <Select multiple collection={roles} width="320px" />
      {/* value={['a']} */}

      <Checkbox
        mt="4"
        checked={checked}
        onCheckedChange={(e) => setChecked(!!e.checked)}
      >
        Block
      </Checkbox>
    </div>
  );
}
