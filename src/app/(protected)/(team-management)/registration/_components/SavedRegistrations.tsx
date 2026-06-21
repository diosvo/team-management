'use client';

import { useCallback, useState } from 'react';

import { Card, HStack, IconButton, Table } from '@chakra-ui/react';
import { Download, Trash2 } from 'lucide-react';

import HighlightText from '@/components/HighlightText';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import useTableState from '@/hooks/use-table-state';
import { useCommonParams } from '@/utils/filters';
import { formatDatetime } from '@/utils/formatter';

import { base64ToBytes, downloadPdf } from '../_helpers/pdf';
import { SavedRegistration } from '../_helpers/useSavedRegistrations';

const HEADERS = ['Name', 'Players', 'Date saved', 'Actions'] as const;

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
  const { currentData, totalCount } = useTableState(items, predicate, page, {
    headerCount: HEADERS.length,
  });

  const handleDownload = (item: SavedRegistration) => {
    setIsDownloading(true);
    toaster.promise(
      (async () =>
        downloadPdf(
          base64ToBytes(item.pdfBase64),
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

  return (
    <Card.Root size="sm">
      <Card.Header>
        <Card.Title>Saved registrations</Card.Title>
        <Card.Description>
          Recent league registrations you have saved.
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <SearchInput placeholder="Filter by name..." />

        <Table.ScrollArea marginBlock={4}>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                {HEADERS.map((header) => (
                  <Table.ColumnHeader key={header} paddingBlock={3}>
                    {header}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell fontWeight="medium">
                      <HighlightText query={q}>{item.leagueName}</HighlightText>
                    </Table.Cell>
                    <Table.Cell>{item.playerCount}</Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      {formatDatetime(item.savedAt)}
                    </Table.Cell>
                    <Table.Cell>
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
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={HEADERS.length}>
                    <EmptyState
                      size="sm"
                      title="No saved registrations yet"
                      description="Click Save in the preview to keep a registration here."
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        <Pagination
          count={totalCount}
          page={page}
          onPageChange={setSearchParams}
        />
      </Card.Body>
    </Card.Root>
  );
}
