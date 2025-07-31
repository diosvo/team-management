import { Metadata } from 'next';
import Link from 'next/link';
import { forbidden, redirect } from 'next/navigation';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';

import { LOGIN_PATH } from '@/routes';
import { hasPermissions } from '@/utils/helper';

import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import { getUser } from '@/features/user/actions/auth';
import TestTypesList from './_components/list';

export const metadata: Metadata = {
  title: 'Test Types',
  description: 'Manage and configure test types for periodic testing',
};

export default async function TestTypesPage() {
  const currentUser = await getUser();
  if (!currentUser) redirect(LOGIN_PATH);

  const { isGuest, isPlayer } = hasPermissions(currentUser.role);
  if (isGuest || isPlayer) forbidden();

  const data = await getTestTypes();

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
