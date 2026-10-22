import { Span } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

/** Static page intro, shared with `loading.tsx` so it never shifts. */
export default function RegistrationIntro() {
  return (
    <>
      <PageTitle title="Registration" />
      <Span fontSize="sm" color="fg.muted">
        Register players for a league. Optionally attach a registration PDF,
        then export as CSV or PDF.
      </Span>
    </>
  );
}
