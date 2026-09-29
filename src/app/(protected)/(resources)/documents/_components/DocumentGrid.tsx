'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SimpleGrid } from '@chakra-ui/react';
import { Film } from 'lucide-react';

import type { DriveLink } from '@/utils/drive';
import { buildPredicate } from '@/utils/filters';

import { useDocumentFilters } from '@/lib/nuqs';

import { getAlbumItems, removeDocument } from '@/actions/document';
import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import type { Document } from '@/drizzle/schema/document';
import usePermissions from '@/hooks/use-permissions';
import useTableState from '@/hooks/use-table-state';

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

  const { currentData, selection, setSelection, totalCount } = useTableState(
    data,
    predicate,
    page,
    { pageSize: PAGE_SIZE },
  );

  const canEdit = can('documents', 'edit');
  const canDelete = can('documents', 'delete');

  const removeItems = async () => {
    const results = await Promise.all(selection.map(removeDocument));
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: t(hasErrors ? 'deletedPartially' : 'deleted', {
        count: successCount,
      }),
    });

    setSelection([]);
  };

  const openEditor = (item: Document) =>
    UpsertDocument.open('update-document', { action: 'Update', item });

  const openPreview = (item: Document, link: DriveLink) =>
    DocumentPreview.open('preview-document', {
      title: item.title,
      link,
      type: item.type,
      // Started here, in the click, so the dialog can suspend on it.
      items: link.kind === 'folder' ? getAlbumItems(link.id) : undefined,
    });

  const toggle = (id: string) => (checked: boolean) =>
    setSelection((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

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
                      onSelect: toggle(item.document_id),
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
          onDelete={removeItems}
        />
      )}

      <UpsertDocument.Viewport />
      <DocumentPreview.Viewport />
    </>
  );
}
