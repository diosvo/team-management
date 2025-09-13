import { Metadata } from 'next';
import Link from 'next/link';
import { forbidden, redirect } from 'next/navigation';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';

import { getUser } from '@/features/user/actions/auth';

import { LOGIN_PATH } from '@/routes';
import { hasPermissions } from '@/utils/helper';

import AddTestResultPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Add Test Result',
  description: 'Add a new test result for periodic testing.',
};

export default async function AddTestResultPage() {
  const currentUser = await getUser();
  if (!currentUser) redirect(LOGIN_PATH);

  const { isGuest, isPlayer } = hasPermissions(currentUser.role);
  if (isGuest || isPlayer) forbidden();

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
        <PageTitle>Add Test Result</PageTitle>
      </HStack>
      <AddTestResultPageClient />
    </>
  );
}
