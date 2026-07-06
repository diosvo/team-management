'use client';

import { useCallback, useState } from 'react';

import { Box, HStack, IconButton } from '@chakra-ui/react';
import { Base64 } from 'js-base64';
import { Download, Trash2 } from 'lucide-react';

import DataTable, { type Column } from '@/components/DataTable';
import HighlightText from '@/components/HighlightText';
import SearchInput from '@/components/SearchInput';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';

import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/lib/nuqs';
import { formatDatetime } from '@/utils/formatter';

import { downloadPdf } from '../_helpers/pdf';
import { SavedRegistration } from '../_helpers/useSavedRegistrations';

type SavedRegistrationsProps = {
  items: Array<SavedRegistration>;
  onRemove: (id: string) => void;
};

export default function SavedRegistrations({
  items,
  onRemove,
}: SavedRegistrationsProps) {
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
          title: 'Preparing download...',
          description: 'Please wait.',
        },
        success: {
          title: 'PDF downloaded',
          description: 'Your file is ready.',
        },
        error: {
          title: 'Cannot download',
          description:
            'This registration was saved before downloads were supported. Re-save it to enable download.',
        },
        finally: () => setIsDownloading(false),
      },
    );
  };

  const handleRemove = (item: SavedRegistration) => {
    toaster.promise((async () => onRemove(item.id))(), {
      loading: { title: 'Removing...', description: 'Please wait.' },
      success: {
        title: 'Registration removed',
        description: `${item.leagueName} was deleted.`,
      },
      error: (error) => ({
        title: 'Could not remove',
        description:
          error instanceof Error ? error.message : 'Something went wrong.',
      }),
    });
  };

  const columns: Array<Column<SavedRegistration>> = [
    {
      header: 'Name',
      cellProps: { fontWeight: 'medium' },
      cell: (item) => (
        <HighlightText query={q}>{item.leagueName}</HighlightText>
      ),
    },
    { header: 'Players', cell: (item) => item.playerCount },
    {
      header: 'Date saved',
      cellProps: { whiteSpace: 'nowrap' },
      cell: (item) => formatDatetime(item.savedAt),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <HStack gap={1}>
          <IconButton
            size="xs"
            variant="ghost"
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
    <Card
      title="Saved registrations"
      description="Recent league registrations you have saved."
    >
      <Box marginBlock={4}>
        <SearchInput placeholder="Filter by name..." />
      </Box>

      <DataTable
        columns={columns}
        rowId={(item) => item.id}
        currentData={currentData}
        totalCount={totalCount}
        page={page}
        onPageChange={setSearchParams}
        empty={{
          title: 'No saved registrations yet',
          description: 'Click Save in the preview to keep a registration here.',
        }}
        size="sm"
        borderWidth={undefined}
      />
    </Card>
  );
}
