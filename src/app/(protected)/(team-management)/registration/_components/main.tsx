'use client';

import { useState } from 'react';
import useSWR from 'swr';

import {
  Badge,
  Button,
  Code,
  FileUpload,
  Flex,
  GridItem,
  HStack,
  IconButton,
  Popover,
  Portal,
  SimpleGrid,
  Span,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { HelpCircle, Trophy, Upload, UsersRound } from 'lucide-react';

import SearchableSelect from '@/components/SearchableSelect';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';
import {
  PlayerSelection,
  SelectedPlayers,
} from '@/components/user/PlayerSelection';

import { League } from '@/drizzle/schema';
import { User } from '@/drizzle/schema/user';

import { getLeagues } from '@/actions/league';
import { getActivePlayers } from '@/actions/user';

import usePermissions from '@/hooks/use-permissions';
import { CACHE_KEY } from '@/utils/constant';
import { buildRegistrationPdf, bytesToBase64 } from '../_helpers/pdf';
import { useSavedRegistrations } from '../_helpers/useSavedRegistrations';

import PreviewPanel from './PreviewPanel';
import RegistrationSteps, { type StepDef } from './RegistrationSteps';
import SavedRegistrations from './SavedRegistrations';

const NOTES_LIMIT = 256;

/**
 * Field-name hints mirroring FIELD_PATTERNS in ../_helpers/pdf, so users know
 * how to name their AcroForm fields for auto-mapping to work.
 */
const FIELD_GUIDE: Array<{ label: string; names: Array<string> }> = [
  { label: 'Họ tên', names: ['hoTen', 'fullName', 'name'] },
  { label: 'Năm sinh', names: ['namSinh', 'dob', 'birth'] },
  { label: 'CCCD', names: ['cccd', 'cmnd', 'citizen'] },
  { label: 'Điện thoại', names: ['dienThoai', 'sdt', 'phone'] },
  { label: 'Số áo', names: ['soAo', 'jersey', 'number'] },
];

export default function RegistrationPageClient() {
  const [league, setLeague] = useState<League>();
  const [selection, setSelection] = useState<Array<User>>([]);
  const [template, setTemplate] = useState<File>();
  const [notes, setNotes] = useState('');

  const { isCaptain, isAdmin } = usePermissions();
  const isDisabled = !isCaptain && !isAdmin;

  const { items: saved, save, remove, getUniqueName } = useSavedRegistrations();

  // Shares the SWR cache the player SearchableSelect already populates.
  const { data: activePlayers = [] } = useSWR(
    CACHE_KEY.PLAYERS,
    getActivePlayers,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const allSelected =
    activePlayers.length > 0 && selection.length === activePlayers.length;

  const handleSave = async () => {
    if (!league || selection.length === 0) return;
    const name = getUniqueName(league.name);

    try {
      const { bytes } = await buildRegistrationPdf({
        players: selection,
        league,
        template,
      });
      save({
        leagueName: name,
        playerCount: selection.length,
        notes: notes || undefined,
        templateName: template?.name,
        filename: `saigon-rovers-${name.toLowerCase().replace(/\s+/g, '-')}`,
        pdfBase64: bytesToBase64(bytes),
      });
      toaster.success({
        title: 'Registration saved',
        description: `${selection.length} player(s) for ${name}.`,
      });
    } catch (error) {
      toaster.error({
        title: 'Could not save registration',
        description:
          error instanceof Error ? error.message : 'Something went wrong.',
      });
    }
  };

  const steps: Array<StepDef> = [
    { title: 'Choose players', done: selection.length > 0 },
    { title: 'Pick league', done: !!league },
    { title: 'Attach PDF', done: !!template, isOptional: true },
    { title: 'Review & Export', done: selection.length > 0 && !!league },
  ];

  return (
    <>
      <RegistrationSteps steps={steps} />

      <SimpleGrid columns={{ base: 1, lg: 12 }} gap={6} alignItems="start">
        <GridItem colSpan={{ base: 1, lg: 5 }}>
          <Card
            size="sm"
            title={
              <HStack>
                <UsersRound size={16} />
                Select players
              </HStack>
            }
            action={
              <Badge
                variant="surface"
                colorPalette={selection.length ? 'green' : 'gray'}
              >
                {selection.length} selected
              </Badge>
            }
            description={
              <>
                Only <Span backgroundColor="green.100">active</Span> players are
                shown.
              </>
            }
          >
            <HStack alignItems="end" gap={2}>
              <PlayerSelection
                disabled={isDisabled}
                selection={selection}
                onSelectionChange={setSelection}
              />
              <Button
                variant="outline"
                disabled={
                  isDisabled || activePlayers.length === 0 || allSelected
                }
                onClick={() => setSelection(activePlayers)}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                colorPalette="red"
                disabled={isDisabled || selection.length === 0}
                onClick={() => setSelection([])}
              >
                Clear
              </Button>
            </HStack>

            <SelectedPlayers
              selection={selection}
              onSelectionChange={setSelection}
            />
          </Card>

          <Card
            size="sm"
            marginBlock={6}
            title={
              <HStack>
                <Trophy size={16} />
                Choose a league
              </HStack>
            }
            description="Pick which competition this registration is for."
          >
            <SearchableSelect
              controlledMode={false}
              multiple={false}
              label={CACHE_KEY.LEAGUES}
              action={getLeagues}
              fieldProps={{ disabled: isDisabled }}
              value={league ?? null}
              itemToString={({ name }) => name}
              itemToValue={({ league_id }) => league_id}
              onChange={(item) => setLeague(item ?? undefined)}
            />
          </Card>

          <Card
            size="sm"
            title={
              <HStack>
                <Upload size={16} />
                Attach PDF
                <Span fontSize="xs" color="fg.muted">
                  (optional)
                </Span>
              </HStack>
            }
            action={
              <Popover.Root>
                <Popover.Trigger asChild>
                  <IconButton size="sm" variant="ghost" colorPalette="blue">
                    <HelpCircle size={14} />
                  </IconButton>
                </Popover.Trigger>
                <Portal>
                  <Popover.Positioner>
                    <Popover.Content>
                      <Popover.Arrow />
                      <Popover.Body>
                        <Popover.Title fontWeight="medium">
                          Field names
                        </Popover.Title>
                        <Text fontSize="xs" color="fg.muted" marginTop={1}>
                          Upload a fillable PDF whose text fields are named like
                          below — they&apos;ll be filled automatically.
                        </Text>
                        <Stack gap={2} marginTop={3}>
                          {FIELD_GUIDE.map(({ label, names }) => (
                            <Flex
                              key={label}
                              justifyContent="space-between"
                              alignItems="center"
                              gap={3}
                            >
                              <Span fontSize="xs" fontWeight="medium">
                                {label}
                              </Span>
                              <HStack
                                gap={1}
                                flexWrap="wrap"
                                justifyContent="end"
                              >
                                {names.map((name) => (
                                  <Code key={name} size="sm">
                                    {name}
                                  </Code>
                                ))}
                              </HStack>
                            </Flex>
                          ))}
                        </Stack>
                      </Popover.Body>
                      <Popover.Footer fontSize="xs" color="fg.muted">
                        No fillable fields? We&apos;ll generate a roster from
                        scratch instead.
                      </Popover.Footer>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
            }
            description="Upload a fillable PDF form or auto-generate a roster for the current league."
          >
            <FileUpload.Root
              accept="application/pdf"
              maxFiles={1}
              maxFileSize={10 * 1024 * 1024}
              disabled={isDisabled}
              onFileChange={({ acceptedFiles }) =>
                setTemplate(acceptedFiles[0])
              }
            >
              <FileUpload.HiddenInput />
              {!template && (
                <FileUpload.Dropzone width="full" minHeight="20">
                  <Upload size={16} />
                  <FileUpload.DropzoneContent>
                    <Span>Click to upload PDF</Span>
                    <Span color="fg.muted" fontSize="xs">
                      Max 10 MB
                    </Span>
                  </FileUpload.DropzoneContent>
                </FileUpload.Dropzone>
              )}
              <FileUpload.List clearable />
            </FileUpload.Root>

            <HStack marginBlock={2}>
              <Span fontWeight="medium" fontSize="sm">
                Notes
              </Span>
              <Span fontSize="xs" color="fg.muted">
                (optional)
              </Span>
              <Span fontSize="xs" color="fg.muted" marginLeft="auto">
                {notes.length}/{NOTES_LIMIT}
              </Span>
            </HStack>
            <Textarea
              size="sm"
              rows={3}
              resize="none"
              value={notes}
              disabled={isDisabled}
              maxLength={NOTES_LIMIT}
              placeholder="Internal notes about this registration…"
              onChange={(event) => setNotes(event.target.value)}
            />
          </Card>
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 7 }}>
          <Stack gap={6}>
            <PreviewPanel
              players={selection}
              league={league}
              template={template}
              onSave={handleSave}
            />
          </Stack>
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 12 }}>
          <SavedRegistrations items={saved} onRemove={remove} />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
