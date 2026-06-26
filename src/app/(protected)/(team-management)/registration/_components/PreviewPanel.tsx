'use client';

import { useEffect, useState } from 'react';

import { Box, Button, HStack, Spinner, Table, Text } from '@chakra-ui/react';
import {
  Eye,
  FileDown,
  FileText,
  Save,
  Table as TableIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';

import { League } from '@/drizzle/schema';
import { User } from '@/drizzle/schema/user';

import {
  buildRegistrationPdf,
  COLUMNS,
  downloadCsv,
  downloadPdf,
  toRow,
} from '../_helpers/pdf';

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
  const [busy, setBusy] = useState(false);

  const ready = players.length > 0 && !!league;
  const filename = league
    ? `sgr-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : 'sgr';

  const handleCsv = () => {
    toaster.promise((async () => downloadCsv(players, filename))(), {
      loading: {
        title: 'Preparing CSV...',
        description: 'Generating your file.',
      },
      success: { title: 'CSV downloaded', description: 'Your file is ready.' },
      error: (error) => ({
        title: 'Could not download CSV',
        description:
          error instanceof Error ? error.message : 'Something went wrong.',
      }),
    });
  };

  const handlePdf = () => {
    setBusy(true);
    toaster.promise(buildRegistrationPdf({ players, league, template }), {
      loading: { title: 'Generating PDF...', description: 'Please wait.' },
      success: ({ bytes, filledCount, detectedFields }) => {
        downloadPdf(bytes, filename);
        if (template && filledCount === 0) {
          return {
            type: 'warning',
            title: 'No fields matched',
            description: `Found ${detectedFields.length} field(s) but none matched player data.`,
          };
        }
        return { title: 'PDF downloaded', description: 'Your file is ready.' };
      },
      error: (error) => ({
        title: 'Could not generate PDF',
        description:
          error instanceof Error ? error.message : 'Something went wrong.',
      }),
      finally: () => setBusy(false),
    });
  };

  return (
    <Card
      size="sm"
      title={
        <HStack gap={2}>
          <Eye size={16} />
          Preview
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
            <Save /> Save
          </Button>
        </HStack>
      }
      footer={
        <Text fontSize="sm" color="fg.muted" marginInline="auto">
          {template
            ? `Using uploaded form: ${template.name}`
            : 'No PDF uploaded - showing the registration as a table.'}
        </Text>
      }
    >
      {!ready ? (
        <EmptyState
          size="sm"
          icon={<TableIcon />}
          title="Nothing to preview yet"
          description="Select at least one player and a league to see the preview."
        />
      ) : template ? (
        <PdfPreview players={players} league={league} template={template} />
      ) : (
        <TablePreview players={players} />
      )}
    </Card>
  );
}

function TablePreview({ players }: { players: Array<User> }) {
  return (
    <Table.ScrollArea>
      <Table.Root size="sm" borderWidth={1}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>#</Table.ColumnHeader>
            {COLUMNS.map((column) => (
              <Table.ColumnHeader key={column.key}>
                {column.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {players.map((player, index) => {
            const row = toRow(player);
            return (
              <Table.Row key={player.id}>
                <Table.Cell color="fg.muted">{index + 1}</Table.Cell>
                {COLUMNS.map((column) => (
                  <Table.Cell key={column.key}>
                    {row[column.key] || '-'}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function PdfPreview({
  players,
  league,
  template,
}: Required<Pick<PreviewPanelProps, 'players' | 'league' | 'template'>>) {
  const [url, setUrl] = useState<Nullable<string>>(null);
  const [error, setError] = useState<Nullable<string>>(null);

  useEffect(() => {
    let objectUrl: Nullable<string> = null;
    let cancelled = false;

    buildRegistrationPdf({ players, league, template })
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
          setError(err instanceof Error ? err.message : 'Preview failed.');
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [players, league, template]);

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
        <Spinner size="sm" /> <Text fontSize="sm">Rendering preview…</Text>
      </HStack>
    );
  }

  return (
    <Box
      asChild
      height="70vh"
      borderWidth={1}
      borderRadius="md"
      overflow="hidden"
    >
      <iframe
        title="Registration preview"
        src={url}
        width="100%"
        height="100%"
      />
    </Box>
  );
}
