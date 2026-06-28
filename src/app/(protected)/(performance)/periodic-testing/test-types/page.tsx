import { Metadata } from 'next';

import { getTestTypes } from '@/actions/test-type';

import TestTypesFilters from './_components/TestTypesFilters';
import TestTypesHeader from './_components/TestTypesHeader';
import TestTypesTable from './_components/TestTypesTable';

export const metadata: Metadata = {
  title: 'Test Types',
  description: 'Manage and configure test types for periodic testing',
};

export default async function TestTypesPage() {
  const data = await getTestTypes();

  return (
    <>
      <TestTypesHeader />
      <TestTypesFilters />
      <TestTypesTable data={data} />
    </>
  );
}
