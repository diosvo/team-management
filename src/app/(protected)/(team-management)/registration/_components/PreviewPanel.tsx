'use client';

import { useCallback, useEffect, useState } from 'react';

import { Box, Button, HStack, Spinner, Text } from '@chakra-ui/react';
import {
  Eye,
  FileDown,
  FileText,
  Save,
  Table as TableIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import DataTable, { type Column } from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import useTableState from '@/hooks/use-table-state';

import type { League } from '@/drizzle/schema';
import type { User } from '@/drizzle/schema/user';

import { COLUMNS, downloadCsv, downloadPdf, toRow } from '../_helpers/roster';

type PreviewPanelProps = {
  players: Array<User>;
  league?: League;
  template?: File;
  onSave?: () => void;
};

export default function PreviewPanel({
  players,
  league,
  template,
  onSave,
}: PreviewPanelProps) {
  const t = useTranslations('registration.preview');
  const tCommon = useTranslations('common');
  const [busy, setBusy] = useState(false);

  const ready = players.length > 0 && !!league;
  const filename = league
    ? `sgr-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'sgr';

  const handleCsv = () => {
    toaster.promise((async () => downloadCsv(players, filename))(), {
      loading: {
        title: t('csvLoading'),
        description: t('csvLoadingDescription'),
      },
      success: { title: t('csvSuccess'), description: t('fileReady') },
      error: (error) => ({
        title: t('csvError'),
        description:
          error instanceof Error
            ? error.message
            : tCommon('somethingWentWrong'),
      }),
    });
  };

  const handlePdf = () => {
    setBusy(true);
    // pdf-lib is loaded on demand so it stays out of the route's initial JS
    const pdfPromise = import('../_helpers/pdf').then(
      ({ buildRegistrationPdf }) =>
        buildRegistrationPdf({ players, league, template }),
    );
    toaster.promise(pdfPromise, {
      loading: { title: t('pdfLoading'), description: t('pleaseWait') },
      success: ({ bytes, filledCount, detectedFields }) => {
        downloadPdf(bytes, filename);
        if (template && filledCount === 0) {
          return {
            type: 'warning',
            title: t('noFieldsMatched'),
            description: t('noFieldsMatchedDescription', {
              count: detectedFields.length,
            }),
          };
        }
        return { title: t('pdfSuccess'), description: t('fileReady') };
      },
      error: (error) => ({
        title: t('pdfError'),
        description:
          error instanceof Error
            ? error.message
            : tCommon('somethingWentWrong'),
      }),
      finally: () => setBusy(false),
    });
  };

  return (
    <Card
      title={
        <HStack>
          <Eye size={16} />
          {t('title')}
        </HStack>
      }
      action={
        <HStack>
          <Button
            size={{ base: 'xs', md: 'sm' }}
            variant="outline"
            disabled={!ready}
            onClick={handleCsv}
          >
            <FileText /> CSV
          </Button>
          <Button
            size={{ base: 'xs', md: 'sm' }}
            variant="outline"
            loading={busy}
            disabled={!ready}
            onClick={handlePdf}
          >
            <FileDown /> PDF
          </Button>
          <Button
            size={{ base: 'xs', md: 'sm' }}
            disabled={!ready}
            onClick={onSave}
          >
            <Save /> {t('save')}
          </Button>
        </HStack>
      }
      footer={
        <Text
          textStyle="caption"
          color="fg.muted"
          marginInline="auto"
          minWidth={0}
          lineClamp={1}
          wordBreak="break-all"
        >
          {template
            ? t('usingTemplate', { name: template.name })
            : t('noTemplate')}
        </Text>
      }
    >
      {!ready ? (
        <EmptyState
          size="sm"
          icon={<TableIcon />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : template ? (
        <PdfPreview players={players} league={league} template={template} />
      ) : (
        <TablePreview players={players} />
      )}
    </Card>
  );
}

const PAGE_SIZE = 10;

function TablePreview({ players }: { players: Array<User> }) {
  const t = useTranslations('registration.preview');
  const [page, setPage] = useState(1);

  const predicate = useCallback(() => true, []);
  const { currentData, totalCount } = useTableState(players, predicate, page, {
    pageSize: PAGE_SIZE,
  });

  const columns: Array<Column<User>> = [
    {
      header: '#',
      cell: (_player, index) => (page - 1) * PAGE_SIZE + index + 1,
      cellProps: { color: 'fg.muted' },
    },
    ...COLUMNS.map((column): Column<User> => ({
      header: column.header,
      cell: (player) => toRow(player)[column.key],
    })),
  ];

  return (
    <DataTable
      size="sm"
      columns={columns}
      rowId={(player) => player.id}
      page={page}
      pageSize={PAGE_SIZE}
      totalCount={totalCount}
      currentData={currentData}
      onPageChange={({ page }) => setPage(page)}
      marginBottom={2}
      empty={{ title: t('noPlayers'), icon: <TableIcon /> }}
    />
  );
}

function PdfPreview({
  players,
  league,
  template,
}: Required<Pick<PreviewPanelProps, 'players' | 'league' | 'template'>>) {
  const t = useTranslations('registration.preview');
  const [url, setUrl] = useState<Nullable<string>>(null);
  const [error, setError] = useState<Nullable<string>>(null);

  useEffect(() => {
    let objectUrl: Nullable<string> = null;
    let cancelled = false;

    import('../_helpers/pdf')
      .then(({ buildRegistrationPdf }) =>
        buildRegistrationPdf({ players, league, template }),
      )
      .then(({ bytes }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        );
        setError(null);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('failed'));
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [players, league, template, t]);

  if (error) {
    return (
      <Text fontSize="sm" color="red.fg">
        {error}
      </Text>
    );
  }

  if (!url) {
    return (
      <HStack justifyContent="center" paddingBlock={10} color="fg.muted">
        <Spinner size="sm" /> <Text fontSize="sm">{t('rendering')}</Text>
      </HStack>
    );
  }

  return (
    <Box
      asChild
      height={{ base: '60vh', md: '70vh' }}
      borderWidth={1}
      borderRadius="md"
      overflow="hidden"
    >
      <iframe title={t('iframeTitle')} src={url} width="100%" height="100%" />
    </Box>
  );
}
