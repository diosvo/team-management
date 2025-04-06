// 'use client';

import { Avatar, Card, Text } from '@chakra-ui/react';

import LogoutButton from '@/app/(auth)/_components/logout-button';

import { getUser } from '@/features/user/actions/auth';

export default async function DashboardPage() {
  const user = await getUser();
  // const [isPending, startTransition] = useTransition();

  // const [roles, setRoles] = useState<Array<UserRole>>(user?.roles);

  const onSettings = () => {
    // startTransition(() => {
    //   settings({
    //     name: 'Dios Vo',
    //     roles,
    //   }).then(({ error, message }) => {
    //     toaster.create({
    //       description: message,
    //       type: error ? 'error' : 'info',
    //     });
    //     // if (!error) update();
    //   });
    // });
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
          <Card.Title mt="2">{user?.name}</Card.Title>
          <Card.Description>{user?.id}</Card.Description>
        </Card.Body>
        <Card.Footer justifyContent="flex-end">
          {/* <Button onClick={onSettings} loading={isPending}>
            Update Settings
          </Button> */}
        </Card.Footer>
      </Card.Root>

      <Text fontWeight="medium" mt="4">
        Admin Only
      </Text>

      {/* <Visibility isVisible={user.roles.includes('PLAYER')}>
        <Select
          multiple
          collection={[
            { label: 'Super Admin', value: 'SUPER_ADMIN' },
            { label: 'Coach', value: 'COACH' },
            { label: 'Player', value: 'PLAYER' },
            { label: 'Guest', value: 'GUEST' },
          ]}
          width="300px"
          value={roles}
          onValueChange={({ value }) => {
            setRoles(value as Array<UserRole>);
          }}
        />
      </Visibility> */}
    </div>
  );
}
