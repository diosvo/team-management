'use client';

import { useTranslations } from 'next-intl';
import { countBy } from 'es-toolkit';

import { AccountStatus, enumValues } from '@/utils/enum';
import { getColor } from '@/utils/helper';

import { useAccountFilters } from '@/lib/nuqs';

import { Stat, StatGroup } from '@/components/ui/stat';
import type { Account } from '@/db/account';

/** Counts per sign-in status; a click filters the table to that status. */
export default function AccountStats({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  const t = useTranslations('accounts.stats');
  const [params, setSearchParams] = useAccountFilters();

  const counts = countBy(accounts, (account) => account.status);

  return (
    <StatGroup>
      <Stat
        label={t('total')}
        value={accounts.length}
        onClick={() => setSearchParams(null)}
      />
      {enumValues(AccountStatus).map((status) => (
        <Stat
          key={status}
          label={t(status)}
          value={counts[status] ?? 0}
          color={getColor(status)}
          onClick={() =>
            setSearchParams({ ...params, status: [status], page: 1 })
          }
        />
      ))}
    </StatGroup>
  );
}
