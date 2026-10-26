'use client';

import { useCallback, useState } from 'react';

import { Box, HStack, IconButton } from '@chakra-ui/react';
import { Base64 } from 'js-base64';
import { Download, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import SearchInput from '@/components/SearchInput';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';

import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { formatDatetime } from '@/utils/datetime';

import { downloadPdf } from '../_helpers/roster';
import type { SavedRegistration } from '../_helpers/useSavedRegistrations';

type SavedRegistrationsProps = {
  items: Array<SavedRegistration>;
  onRemove: (id: string) => void;
};

export default function SavedRegistrations({
  items,
  onRemove,
}: SavedRegistrationsProps) {
  const t = useTranslations('registration.saved');
  const tCommon = useTranslations('common');
  const [{ q, page }, setSearchParams] = useCommonParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const predicate = useCallback(
    (item: SavedRegistration) =>
      item.leagueName.toLowerCase().includes(q.toLowerCase()),
    [q],
  );
  const { currentData, totalCount } = useTableState(items, predicate, page);

  const handleDownload = (item: SavedRegistration) => {
    setIsDownloading(true);
    toaster.promise(
      (async () =>
        downloadPdf(
          Base64.toUint8Array(item.pdfBase64),
          item.filename ?? 'registration',
        ))(),
      {
        loading: {
          title: t('downloadLoading'),
          description: t('pleaseWait'),
        },
        success: {
          title: t('downloadSuccess'),
          description: t('fileReady'),
        },
        error: {
          title: t('downloadError'),
          description: t('downloadErrorDescription'),
        },
        finally: () => setIsDownloading(false),
      },
    );
  };

  const handleRemove = (item: SavedRegistration) => {
    toaster.promise((async () => onRemove(item.id))(), {
      loading: { title: t('removeLoading'), description: t('pleaseWait') },
      success: {
        title: t('removeSuccess'),
        description: t('removeSuccessDescription', { name: item.leagueName }),
      },
      error: (error) => ({
        title: t('removeError'),
        description:
          error instanceof Error
            ? error.message
            : tCommon('somethingWentWrong'),
      }),
    });
  };

  const columns: Array<Column<SavedRegistration>> = [
    {
      header: t('name'),
      cellProps: { fontWeight: 'medium' },
      cell: (item) => (
        <HighlightText query={q}>{item.leagueName}</HighlightText>
      ),
    },
    { header: t('players'), cell: (item) => item.playerCount },
    {
      header: t('dateSaved'),
      cellProps: { whiteSpace: 'nowrap' },
      cell: (item) => formatDatetime(item.savedAt),
    },
    {
      header: tCommon('actions'),
      cell: (item) => (
        <HStack gap={1}>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={t('download')}
            hidden={!item.pdfBase64}
            disabled={isDownloading}
            onClick={() => handleDownload(item)}
          >
            <Download />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            aria-label={t('remove')}
            disabled={isDownloading}
            onClick={() => handleRemove(item)}
          >
            <Trash2 />
          </IconButton>
        </HStack>
      ),
    },
  ];

  return (
    <Card title={t('title')} description={t('description')}>
      <Box marginBlock={4}>
        <SearchInput placeholder={t('searchPlaceholder')} />
      </Box>

      <DataTable
        columns={columns}
        rowId={(item) => item.id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDescription'),
        }}
        size="sm"
        borderWidth={undefined}
      />
    </Card>
  );
}
