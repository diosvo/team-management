import { Metadata } from 'next';
import Link from 'next/link';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';

import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import { getUser } from '@/features/user/actions/auth';
import { LOGIN_PATH } from '@/routes';
import { hasPermissions } from '@/utils/helper';
import { forbidden, redirect } from 'next/navigation';
import TestTypesList from './_components/list';

export const metadata: Metadata = {
  title: 'Manage Test Types',
  description: 'Manage and configure test types for periodic testing',
};

export default async function TestTypesPage() {
  const data = await getTestTypes();
  const currentUser = await getUser();

  if (!currentUser) {
    redirect(LOGIN_PATH);
  }

  const { isGuest, isPlayer } = hasPermissions(currentUser.role);

  // Prevent guest/user from accessing this page
  if (isGuest || isPlayer) {
    forbidden();
  }

  return (
    <>
      <HStack gap={2} marginBottom={6}>
        <Tooltip content="Back to Periodic Testing">
          <Button variant="ghost" asChild>
            <Link href="../periodic-testing">
              <MoveLeft />
            </Link>
          </Button>
        </Tooltip>
        <PageTitle>Test Types</PageTitle>
      </HStack>
      <TestTypesList data={data} />
    </>
  );
}
