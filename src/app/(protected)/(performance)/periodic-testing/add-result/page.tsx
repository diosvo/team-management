import { Metadata } from 'next';
import Link from 'next/link';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';

import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import { getRoster } from '@/features/user/actions/user';
import { UserRole, UserState } from '@/utils/enum';

import AddTestResultPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Add Test Result',
  description: 'Add a new test result for periodic testing.',
};

export default async function AddTestResultPage() {
  const [players, testTypes] = await Promise.all([
    getRoster({
      query: '',
      role: [UserRole.PLAYER],
      state: [UserState.ACTIVE],
    }),
    getTestTypes(),
  ]);

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
      <AddTestResultPageClient players={players} testTypes={testTypes} />
    </>
  );
}
