import { Metadata } from 'next';

import PageTitle from '@/components/PageTitle';
import { resend } from '@/lib/resend';

import { Separator, Text } from '@chakra-ui/react';
import EmailPreview from './_components/EmailPreview';
import SentEmails from './_components/SentEmails';

export const metadata: Metadata = {
  title: 'Email Preview',
  description:
    'Static, read-only previews of the transactional email templates.',
};

export default async function EmailPreviewPage() {
  const { data, error } = await resend.emails.list();

  return (
    <>
      <PageTitle title="Sent Emails" />
      {error ? (
        <Text color="tomato">Error: {error.message}</Text>
      ) : (
        <SentEmails emails={data.data} />
      )}

      <Separator />

      <PageTitle title="Email Preview" />
      <EmailPreview />
    </>
  );
}
