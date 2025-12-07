import { Metadata } from 'next';
import Link from 'next/link';
import { forbidden } from 'next/navigation';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/PageTitle';
import { Tooltip } from '@/components/ui/tooltip';

import { canUpsertTestResult } from '@/actions/test-result';
import AddTestResultPageClient from './_components/AddTestResultPageClient';

export const metadata: Metadata = {
  title: 'Add Test Result',
  description: 'Add a new test result for periodic testing.',
};

export default async function AddTestResultPage() {
  const isAllowed = await canUpsertTestResult();

  if (!isAllowed) forbidden();

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
        <PageTitle title="Add Test Result" />
      </HStack>
      <AddTestResultPageClient />
    </>
  );
}
