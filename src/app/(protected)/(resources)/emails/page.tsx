import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageTitle from '@/components/PageTitle';
import { resend } from '@/lib/resend';

import { Separator, Text } from '@chakra-ui/react';
import EmailPreview from './_components/EmailPreview';
import SentEmails from './_components/SentEmails';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('emails.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function EmailPreviewPage() {
  const t = await getTranslations('emails');
  const { data, error } = await resend.emails.list();

  return (
    <>
      <PageTitle title={t('sentTitle')} />
      {error ? (
        <Text color="tomato">{t('error', { message: error.message })}</Text>
      ) : (
        <SentEmails emails={data.data} />
      )}

      <Separator />

      <PageTitle title={t('previewTitle')} />
      <EmailPreview />
    </>
  );
}
