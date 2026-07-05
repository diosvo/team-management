import { Metadata } from 'next';
import { forbidden } from 'next/navigation';

import PageTitle from '@/components/PageTitle';

import { canCreateTestResult } from '@/actions/test-result';
import AddTestResultPageClient from './_components/AddTestResultPageClient';

export const metadata: Metadata = {
  title: 'Add Test Result',
  description: 'Add a new test result for periodic testing.',
};

export default async function AddTestResultPage() {
  const isAllowed = await canCreateTestResult();

  if (!isAllowed) forbidden();

  return (
    <>
      <PageTitle title="Add Test Result" />
      <AddTestResultPageClient />
    </>
  );
}
