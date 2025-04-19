import Link from 'next/link';

import { Button, Center, EmptyState, VStack } from '@chakra-ui/react';
import { LockKeyhole } from 'lucide-react';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export default function Forbidden() {
  return (
    <Center h="100vh">
      <EmptyState.Root size="lg">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <LockKeyhole color="red" />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>Access Denied</EmptyState.Title>
            <EmptyState.Description>
              You are not authorized to access this resource.
            </EmptyState.Description>
          </VStack>
          <Button variant="subtle" asChild>
            <Link href={DEFAULT_LOGIN_REDIRECT}>Return Dashboard</Link>
          </Button>
        </EmptyState.Content>
      </EmptyState.Root>
    </Center>
  );
}
