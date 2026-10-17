import { Separator } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';

import FiltersSkeleton from '@/components/filters/FiltersSkeleton';
import { TableSkeleton } from '@/components/PageSkeleton';
import PageTitle from '@/components/PageTitle';

import EmailPreview from './_components/EmailPreview';

export default async function Loading() {
  const t = await getTranslations('emails');

  return (
    <>
      <PageTitle title={t('sentTitle')} />
      <FiltersSkeleton filters />
      <TableSkeleton columns={4} />

      <Separator />

      {/* Static samples: rendered for real. */}
      <PageTitle title={t('previewTitle')} />
      <EmailPreview />
    </>
  );
}
