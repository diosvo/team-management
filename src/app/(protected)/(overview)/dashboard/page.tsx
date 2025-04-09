import { Avatar, Card } from '@chakra-ui/react';

import LogoutButton from '@/app/(auth)/_components/logout-button';
import { getUser } from '@/lib/dal';

export default async function DashboardPage() {
  const user = await getUser();

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
          <Card.Title mt="2">{user?.name}</Card.Title>
          <Card.Description>{user?.id}</Card.Description>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
