import { Metadata } from 'next';

import PageTitle from '@/components/PageTitle';
import { Span } from '@chakra-ui/react';

import RegistrationPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Tournament Registration',
  description: 'Register players for the tournament',
};

export default async function RegistrationPage() {
  return (
    <>
      <PageTitle title="Registration" />
      <Span fontSize="sm" color="fg.muted">
        Register players for a league. Optionally attach a registration PDF,
        then export as CSV or PDF.
      </Span>
      <RegistrationPageClient />
    </>
  );
}
