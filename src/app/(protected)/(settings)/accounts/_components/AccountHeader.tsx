'use client';

import { useTranslations } from 'next-intl';

import PageHeader from '@/components/PageHeader';
import type { Account } from '@/db/account';

import AccountGuide from './AccountGuide';
import AddUser from './AddUser';

/** The one place to invite members; Roster is read-only. */
export default function AccountHeader({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  const t = useTranslations('accounts');

  return (
    <PageHeader title={t('title')}>
      <AccountGuide />
      <AddUser members={accounts} />
    </PageHeader>
  );
}
