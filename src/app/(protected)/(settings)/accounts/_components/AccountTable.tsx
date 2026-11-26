'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, HStack, Text } from '@chakra-ui/react';
import { KeyRound, LogOut, UserRound, UsersRound } from 'lucide-react';

import { formatDate, formatDatetime } from '@/utils/datetime';
import { visibleEmail } from '@/utils/email';
import { AccountStatus } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';
import { getColor } from '@/utils/helper';
import type { Response } from '@/utils/response';

import { useAccountFilters } from '@/lib/nuqs';

import {
  removeAccount,
  removeSessions,
  sendPasswordLink,
} from '@/actions/account';
import DataTable, {
  type Column,
  RowAction,
  RowActionButton,
} from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import type { Account } from '@/db/account';
import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';
import { enumLabel } from '@/i18n/enums';
import { useSessionContext } from '@/providers/session';

import { UpdateAccount } from './UpdateAccount';

export default function AccountTable({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  const t = useTranslations('accounts');
  const tCommon = useTranslations('common');
  const tEnums = useTranslations('enums');
  const { can } = usePermissions();
  const { user } = useSessionContext();
  const [isSending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<Nullable<string>>(null);
  const [{ q, page, status }, setSearchParams] = useAccountFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<Account>({
        search: { query: q, fields: ['name', 'email'] },
        match: { status },
      }),
    [q, status],
  );
  const {
    items,
    currentData,
    selection,
    setSelection,
    totalCount,
    isPending,
    removeSelected,
  } = useTableState(accounts, predicate, page);

  /** Runs `action` per selected account under one toast. */
  const runForSelection = (
    action: (id: string) => Promise<Response>,
    titles: { loading: string; done: (count: number) => string },
  ) => {
    const ids = selection;
    const id = toaster.create({ type: 'loading', title: titles.loading });

    startTransition(async () => {
      const results = await Promise.all(ids.map((user_id) => action(user_id)));
      const failed = results.find(({ success }) => !success);

      if (failed) {
        toaster.update(id, { type: 'error', title: failed.message });
        return;
      }

      const [only] = results;
      toaster.update(id, {
        type: 'success',
        // One member: the action's own message names them
        title:
          results.length === 1 && only ? only.message : titles.done(ids.length),
      });
      setSelection([]);
    });
  };

  /** Ends one member's sessions right away, from their row. */
  const revokeSessions = (account: Account) => {
    setRevokingId(account.id);
    const id = toaster.create({
      type: 'loading',
      title: t('table.signingOut'),
    });

    startTransition(async () => {
      const { success, message: title } = await removeSessions(account.id);
      toaster.update(id, { type: success ? 'success' : 'error', title });
      setRevokingId(null);
    });
  };

  const statusHint = (account: Account) => {
    const datetime = formatDatetime(account.link_expires_at);
    if (account.status === AccountStatus.NO_EMAIL)
      return t('table.addEmailHint');
    if (account.status === AccountStatus.INVITED)
      return t('table.linkExpires', { datetime });
    if (account.status === AccountStatus.LINK_EXPIRED) {
      return account.link_expires_at
        ? t('table.linkExpired', { datetime })
        : t('table.noLink');
    }
    return null;
  };

  const columns: Array<Column<Account>> = [
    {
      header: t('table.name'),
      cell: (account) => (
        <HStack>
          <Text>
            <HighlightText query={q}>{account.name}</HighlightText>
          </Text>
          {account.id === user?.id && (
            <Badge size="sm" variant="subtle">
              {t('table.you')}
            </Badge>
          )}
        </HStack>
      ),
    },
    {
      header: t('table.email'),
      cell: (account) => {
        const email = visibleEmail(account.email);
        return email ? (
          <HighlightText query={q}>{email}</HighlightText>
        ) : (
          <Text color="fg.muted">{tCommon('noEmail')}</Text>
        );
      },
    },
    {
      header: t('table.role'),
      cell: (account) => (
        <Badge variant="outline" borderRadius="full">
          {enumLabel(tEnums, 'userRole', account.role)}
        </Badge>
      ),
    },
    {
      header: t('table.status'),
      cell: (account) => {
        const hint = statusHint(account);
        const badge = (
          <Badge
            variant="surface"
            borderRadius="full"
            colorPalette={getColor(account.status)}
          >
            {t(`status.${account.status}`)}
          </Badge>
        );

        return hint ? <Tooltip content={hint}>{badge}</Tooltip> : badge;
      },
    },
    {
      header: t('table.sessions'),
      align: 'center',
      cell: (account) => account.active_sessions,
    },
    {
      header: t('table.lastSignIn'),
      cell: (account) => formatDatetime(account.last_sign_in_at),
    },
    {
      header: t('table.ipAddress'),
      cell: (account) =>
        account.last_sign_in_ip ? (
          <Text fontFamily="mono" fontSize="sm">
            {account.last_sign_in_ip}
          </Text>
        ) : (
          '-'
        ),
    },
    {
      header: t('table.added'),
      cell: (account) => formatDate(account.createdAt),
    },
    {
      header: t('table.actions'),
      align: 'center',
      cell: (account) => (
        <HStack gap={1} justifyContent="center">
          <RowAction
            label={t('table.viewProfile')}
            icon={UserRound}
            href={`/profile/${account.id}`}
          />
          {can('accounts', 'edit') &&
            account.id !== user?.id &&
            account.active_sessions > 0 && (
              <RowActionButton
                label={t('table.signOut')}
                icon={LogOut}
                colorPalette="orange"
                loading={revokingId === account.id}
                onClick={() => revokeSessions(account)}
              />
            )}
        </HStack>
      ),
    },
  ];

  const busy = isPending || isSending;

  return (
    <>
      <DataTable
        columns={columns}
        rowId={(account) => account.id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{ title: t('table.empty'), icon: <UsersRound /> }}
        // Your own row is read-only: manage yourself on your profile
        isRowClickable={(account) => account.id !== user?.id}
        onRowClick={
          can('accounts', 'edit')
            ? (account) => UpdateAccount.open('update-account', { account })
            : undefined
        }
        selection={{
          canSelect: can('accounts', 'delete'),
          items,
          selection,
          setSelection,
          disabled: busy,
          // Admins can't sign themselves out or delete themselves here
          isSelectable: (account) => account.id !== user?.id,
          onDelete: () => removeSelected(removeAccount, 'account'),
          actions: (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  runForSelection(sendPasswordLink, {
                    loading: t('table.sendingLinks'),
                    done: (count) => t('table.linksSent', { count }),
                  })
                }
              >
                <KeyRound />
                {t('table.sendLink')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="orange"
                disabled={busy}
                onClick={() =>
                  runForSelection(removeSessions, {
                    loading: t('table.signingOut'),
                    done: (count) => t('table.signedOutCount', { count }),
                  })
                }
              >
                <LogOut />
                {t('table.signOut')}
              </Button>
            </>
          ),
        }}
      />
      <UpdateAccount.Viewport />
    </>
  );
}
