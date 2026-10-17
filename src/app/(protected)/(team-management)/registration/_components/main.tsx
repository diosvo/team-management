'use client';

import { useState } from 'react';

import {
  Badge,
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
import { Base64 } from 'js-base64';
import { useTranslations } from 'next-intl';
import { HelpCircle, Trophy, Upload, UsersRound } from 'lucide-react';

import SearchableSelect from '@/components/SearchableSelect';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';
import {
  PlayerSelectionWithActions,
  SelectedPlayers,
} from '@/components/user/PlayerSelection';

import type { League } from '@/drizzle/schema';
import type { User } from '@/drizzle/schema/user';

import { getLeagues } from '@/actions/league';

import usePermissions from '@/hooks/use-permissions';
import { CACHE_KEY } from '@/utils/constants';
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
  const t = useTranslations('registration');
  const tCommon = useTranslations('common');
  const [league, setLeague] = useState<League>();
  const [selection, setSelection] = useState<Array<User>>([]);
  const [template, setTemplate] = useState<File>();
  const [notes, setNotes] = useState('');

  const { isCaptain, isAdmin } = usePermissions();
  const isDisabled = !isCaptain && !isAdmin;

  const { items: saved, save, remove, getUniqueName } = useSavedRegistrations();

  const handleSave = async () => {
    if (!league || selection.length === 0) return;
    const name = getUniqueName(league.name);

    try {
      // pdf-lib is loaded on demand so it stays out of the route's initial JS
      const { buildRegistrationPdf } = await import('../_helpers/pdf');
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
        pdfBase64: Base64.fromUint8Array(bytes),
      });
      toaster.success({
        title: t('save.success'),
        description: t('save.successDescription', {
          count: selection.length,
          name,
        }),
      });
    } catch (error) {
      toaster.error({
        title: t('save.error'),
        description:
          error instanceof Error
            ? error.message
            : tCommon('somethingWentWrong'),
      });
    }
  };

  const steps: Array<StepDef> = [
    { title: t('steps.choosePlayers'), done: selection.length > 0 },
    { title: t('steps.pickLeague'), done: !!league },
    { title: t('steps.attachPdf'), done: !!template, isOptional: true },
    { title: t('steps.review'), done: selection.length > 0 && !!league },
  ];

  return (
    <>
      <RegistrationSteps steps={steps} />

      <SimpleGrid columns={{ base: 1, lg: 12 }} gap={6} alignItems="start">
        <GridItem colSpan={{ base: 1, lg: 5 }}>
          <Card
            title={
              <HStack>
                <UsersRound size={16} />
                {t('players.title')}
              </HStack>
            }
            action={
              <Badge
                variant="surface"
                colorPalette={selection.length ? 'green' : 'gray'}
              >
                {t('players.selected', { count: selection.length })}
              </Badge>
            }
            description={
              <>
                {t.rich('players.description', {
                  active: (chunks) => (
                    <Span backgroundColor="green.100">{chunks}</Span>
                  ),
                })}
              </>
            }
          >
            <PlayerSelectionWithActions
              selection={selection}
              disabled={isDisabled}
              onSelectionChange={setSelection}
            />
            <SelectedPlayers
              selection={selection}
              onSelectionChange={setSelection}
            />
          </Card>

          <Card
            marginBlock={6}
            title={
              <HStack>
                <Trophy size={16} />
                {t('league.title')}
              </HStack>
            }
            description={t('league.description')}
          >
            <SearchableSelect
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
            title={
              <HStack>
                <Upload size={16} />
                {t('attach.title')}
                <Span fontSize="xs" color="fg.muted">
                  {t('optional')}
                </Span>
              </HStack>
            }
            action={
              <Popover.Root>
                <Popover.Trigger asChild>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="blue"
                    aria-label={t('attach.fieldNames')}
                  >
                    <HelpCircle size={14} />
                  </IconButton>
                </Popover.Trigger>
                <Portal>
                  <Popover.Positioner>
                    <Popover.Content>
                      <Popover.Arrow />
                      <Popover.Body>
                        <Popover.Title fontWeight="medium">
                          {t('attach.fieldNames')}
                        </Popover.Title>
                        <Text fontSize="xs" color="fg.muted" marginTop={1}>
                          {t('attach.fieldNamesHint')}
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
                        {t('attach.noFillableFields')}
                      </Popover.Footer>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
            }
            description={t('attach.description')}
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
                    <Span>{t('attach.upload')}</Span>
                    <Span color="fg.muted" fontSize="xs">
                      {t('attach.maxSize')}
                    </Span>
                  </FileUpload.DropzoneContent>
                </FileUpload.Dropzone>
              )}
              <FileUpload.List clearable />
            </FileUpload.Root>

            <HStack marginBlock={2}>
              <Span fontWeight="medium" fontSize="sm">
                {t('attach.notes')}
              </Span>
              <Span fontSize="xs" color="fg.muted">
                {t('optional')}
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
              placeholder={t('attach.notesPlaceholder')}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Card>
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 7 }}>
          <PreviewPanel
            players={selection}
            league={league}
            template={template}
            onSave={handleSave}
          />
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 12 }}>
          <SavedRegistrations items={saved} onRemove={remove} />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
