import { Separator } from '@chakra-ui/react';

import FiltersSkeleton from '@/components/filters/FiltersSkeleton';
import { TableSkeleton } from '@/components/PageSkeleton';
import PageTitle from '@/components/PageTitle';

import EmailPreview from './_components/EmailPreview';

export default function Loading() {
  return (
    <>
      <PageTitle title="Sent Emails" />
      <FiltersSkeleton filters />
      <TableSkeleton columns={4} />

      <Separator />

      {/* Static samples: rendered for real. */}
      <PageTitle title="Email Preview" />
      <EmailPreview />
    </>
  );
}
