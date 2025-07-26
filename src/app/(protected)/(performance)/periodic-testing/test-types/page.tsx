import PageTitle from '@/components/page-title';
import { Tooltip } from '@/components/ui/tooltip';
import { getTestTypes } from '@/features/periodic-testing/actions/test-type';
import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import TestTypesList from './_components/list';

export const metadata: Metadata = {
  title: 'Manage Test Types',
  description: 'Manage and configure test types for periodic testing',
};

export default async function TestTypesPage() {
  const data = await getTestTypes();

  // Prevent user from accessing this page if they are not an admin
  // if (!isAdmin) {
  //   forbidden();
  // }

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
