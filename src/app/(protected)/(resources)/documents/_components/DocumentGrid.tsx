'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SimpleGrid } from '@chakra-ui/react';
import { Film } from 'lucide-react';

import type { DriveLink } from '@/utils/drive';
import { DriveKind } from '@/utils/enum';
import { buildPredicate } from '@/utils/filters';

import { useDocumentFilters } from '@/lib/nuqs';

import { getAlbumItems, removeDocument } from '@/actions/document';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { EmptyState } from '@/components/ui/empty-state';
import type { Document } from '@/drizzle/schema/document';
import usePermissions from '@/hooks/use-permissions';
import useTableState, { toggleSelection } from '@/hooks/use-table-state';

import DocumentCard from './DocumentCard';
import { DocumentPreview } from './DocumentPreview';
import { UpsertDocument } from './UpsertDocument';

// Two rows on the widest grid (4 columns).
const PAGE_SIZE = 8;

export default function DocumentGrid({ data }: { data: Array<Document> }) {
  const t = useTranslations('documents.grid');
  const { can } = usePermissions();
  const [{ q, page, type, from, to }, setSearchParams] = useDocumentFilters();

  const predicate = useMemo(
    () =>
      buildPredicate<Document>({
        search: { query: q, fields: ['title', 'note'] },
        match: { type },
        within: { field: 'event_date', range: { from, to } },
      }),
    [q, type, from, to],
  );

  const { currentData, selection, setSelection, totalCount, removeSelected } =
    useTableState(data, predicate, page, { pageSize: PAGE_SIZE });

  const canEdit = can('documents', 'edit');
  const canDelete = can('documents', 'delete');

  const openEditor = (item: Document) =>
    UpsertDocument.open('update-document', { action: 'Update', item });

  const openPreview = (item: Document, link: DriveLink) =>
    DocumentPreview.open('preview-document', {
      title: item.title,
      link,
      type: item.type,
      // Started here, in the click, so the dialog can suspend on it.
      items:
        link.kind === DriveKind.FOLDER ? getAlbumItems(link.id) : undefined,
    });

  return (
    <>
      {currentData.length > 0 ? (
        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 3, '2xl': 4 }}
          gap={{ base: 3, lg: 4 }}
        >
          {currentData.map((item) => (
            <DocumentCard
              key={item.document_id}
              item={item}
              query={q}
              canEdit={canEdit}
              onEdit={openEditor}
              onPreview={openPreview}
              selection={
                canDelete
                  ? {
                      selected: selection.includes(item.document_id),
                      onSelect: (checked) =>
                        setSelection(
                          toggleSelection(item.document_id, checked),
                        ),
                    }
                  : undefined
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <EmptyState
          title={t('empty')}
          description={data.length === 0 ? t('emptyHint') : undefined}
          icon={<Film />}
          borderWidth={1}
          rounded="md"
        />
      )}

      <Pagination
        count={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setSearchParams}
      />

      {canDelete && (
        <SelectionActionBar
          open={selection.length > 0}
          selectionCount={selection.length}
          onDelete={() => removeSelected(removeDocument, 'document')}
        />
      )}

      <UpsertDocument.Viewport />
      <DocumentPreview.Viewport />
    </>
  );
}
