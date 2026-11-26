import { useTranslations } from 'next-intl';

import PageHeader from '@/components/PageHeader';
import type { JerseyOrderSheetLink } from '@/db/jersey-order';
import type { RosterUser } from '@/db/user';

import JerseyOrderExport from './JerseyOrderExport';

export default function RosterHeader({
  users,
  googleClientId = '',
  jerseySheet = null,
  paymentEditors = [],
}: {
  users: Array<RosterUser>;
  googleClientId?: string;
  jerseySheet?: Nullable<JerseyOrderSheetLink>;
  paymentEditors?: Array<string>;
}) {
  const t = useTranslations('roster');

  return (
    <PageHeader title={t('title')}>
      <JerseyOrderExport
        users={users}
        googleClientId={googleClientId}
        sheet={jerseySheet}
        paymentEditors={paymentEditors}
      />
    </PageHeader>
  );
}
