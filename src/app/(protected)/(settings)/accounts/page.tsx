import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getAccounts } from '@/actions/account';
import SearchInput from '@/components/SearchInput';

import AccountHeader from './_components/AccountHeader';
import AccountStats from './_components/AccountStats';
import AccountTable from './_components/AccountTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('accounts.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <>
      <AccountHeader accounts={accounts} />
      <AccountStats accounts={accounts} />
      <SearchInput />
      <AccountTable accounts={accounts} />
    </>
  );
}
