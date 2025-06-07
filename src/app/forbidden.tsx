import Link from 'next/link';

import { Button, Center } from '@chakra-ui/react';
import { LockKeyhole } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export default function Forbidden() {
  return (
    <Center h="100vh">
      <EmptyState
        size="lg"
        icon={<LockKeyhole color="red" />}
        title="Access Denied"
        description="You are not authorized to access this resource."
      >
        <Button variant="subtle" asChild>
          <Link href={DEFAULT_LOGIN_REDIRECT}>Return Dashboard</Link>
        </Button>
      </EmptyState>
    </Center>
  );
}
