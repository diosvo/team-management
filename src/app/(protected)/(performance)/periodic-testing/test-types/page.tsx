import { Metadata } from 'next';
import Link from 'next/link';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';

import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';

import { getTestTypes } from '@/actions/test-type';

import TestTypesList from './_components/TestTypesList';

export const metadata: Metadata = {
  title: 'Test Types',
  description: 'Manage and configure test types for periodic testing',
};

export default async function TestTypesPage() {
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
