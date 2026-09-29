'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  createListCollection,
  Dialog,
  HStack,
  Portal,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  Download,
  ExternalLink,
  FilePlus,
  FileSpreadsheet,
} from 'lucide-react';

import { formatDate } from '@/utils/datetime';
import { UserRole, UserState } from '@/utils/enum';

import { openSheetTab } from '@/lib/google-drive';

import { saveJerseyOrderSheet } from '@/actions/jersey-order';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import type { JerseyOrderSheetLink } from '@/db/jersey-order';
import type { RosterUser } from '@/db/user';
import usePermissions from '@/hooks/use-permissions';

import {
  DEFAULT_JERSEY_PRICE,
  DEFAULT_PROVIDER,
  downloadJerseyOrder,
  openJerseyOrderInSheets,
  OTHER_PROVIDER,
  UNIFORM_PROVIDERS,
} from '../_helpers/jersey-order';

function JerseyOrderDialog({
  users,
  googleClientId = '',
  sheet = null,
  paymentEditors = [],
}: {
  users: Array<RosterUser>;
  // Empty when Google Sheets isn't configured; hides that option.
  googleClientId?: string;
  // This year's shared sheet, when one was already created.
  sheet?: Nullable<JerseyOrderSheetLink>;
  // Only they (and the owner) may tick "Đã thu tiền" in Google Sheets.
  paymentEditors?: Array<string>;
}) {
  const t = useTranslations('roster.jerseyOrder');
  const [isDownloading, startDownload] = useTransition();
  const [isOpening, startOpening] = useTransition();
  const isPending = isDownloading || isOpening;
  const providers = useMemo(
    () =>
      createListCollection({
        items: UNIFORM_PROVIDERS.map(({ name }) => ({
          label: name === OTHER_PROVIDER ? t('otherProvider') : name,
          value: name,
        })),
      }),
    [t],
  );
  const [provider, setProvider] = useState<string>(DEFAULT_PROVIDER);
  const [price, setPrice] = useState<number>(DEFAULT_JERSEY_PRICE);

  // Only active players get a prefilled row; the rest is filled in by hand.
  const players = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.role === UserRole.PLAYER && user.state === UserState.ACTIVE,
        )
        .map((user) => ({
          name: user.name,
          jersey_number: user.player?.jersey_number,
          jersey_name: user.player?.jersey_name,
          shirt_size: user.player?.shirt_size,
          short_size: user.player?.short_size,
          short_form: user.player?.short_form,
        })),
    [users],
  );

  const onDownload = () =>
    startDownload(async () => {
      try {
        await downloadJerseyOrder({ players, provider, price });
      } catch {
        toaster.create({ type: 'error', title: t('failed') });
      }
    });

  const onOpenInSheets = () => {
    // Open the tab now, while the click still allows it; it signs in with
    // Google and ends on the uploaded sheet.
    const tab = openSheetTab(googleClientId);
    if (!tab) {
      toaster.create({ type: 'error', title: t('tabBlocked') });
      return;
    }

    startOpening(async () => {
      try {
        const result = await openJerseyOrderInSheets(
          { players, provider, price },
          () => tab.token,
          paymentEditors,
        );
        const { id, url, checkboxes, shared } = result;
        tab.open(url);
        // Remember it so the next export reopens this sheet; the tab is already
        // on its way, so a failed save only costs a duplicate later.
        const saved = await saveJerseyOrderSheet(id);
        if (!saved.success) console.warn('[jersey-order]', saved.message);
        if (!checkboxes) {
          toaster.create({ type: 'warning', title: t('checkboxesFailed') });
        }
        if (!result.protected) {
          toaster.create({ type: 'warning', title: t('protectFailed') });
        }
        if (!shared) {
          toaster.create({ type: 'warning', title: t('shareFailed') });
        }
      } catch (error) {
        tab.fail(error instanceof Error ? error.message : undefined);
        toaster.create({ type: 'error', title: t('sheetFailed') });
      }
    });
  };

  return (
    <Dialog.Root size="sm" lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <FileSpreadsheet />
          {t('trigger')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{t('title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                {sheet && (
                  <Text fontSize="sm">
                    {t('existing', { date: formatDate(sheet.updated_at) })}
                  </Text>
                )}
                <Select.Root
                  collection={providers}
                  value={[provider]}
                  disabled={isPending}
                  onValueChange={({ value: [next] }) =>
                    next && setProvider(next)
                  }
                >
                  <Select.HiddenSelect />
                  <Select.Label>{t('provider')}</Select.Label>
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {providers.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                  <Text fontSize="xs" color="fg.muted" marginTop={1.5}>
                    {t('providerHelper')}
                  </Text>
                </Select.Root>
                <Field label={t('price')} helperText={t('priceHelper')}>
                  <NumberInputRoot
                    width="full"
                    min={0}
                    step={10_000}
                    disabled={isPending}
                    value={String(price)}
                    formatOptions={{ maximumFractionDigits: 0 }}
                    onValueChange={({ valueAsNumber }) =>
                      setPrice(Number.isNaN(valueAsNumber) ? 0 : valueAsNumber)
                    }
                  >
                    <NumberInputField />
                  </NumberInputRoot>
                </Field>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack
                width="full"
                flexWrap="wrap"
                css={{ '& > *': { flex: '1 0 auto' } }}
              >
                <Button
                  variant={googleClientId || sheet ? 'outline' : 'solid'}
                  loading={isDownloading}
                  loadingText={t('exporting')}
                  disabled={isPending}
                  onClick={onDownload}
                >
                  <Download /> {t('submit')}
                </Button>
                {googleClientId && (
                  <Button
                    variant={sheet ? 'outline' : 'solid'}
                    loading={isOpening}
                    loadingText={t('opening')}
                    disabled={isPending}
                    onClick={onOpenInSheets}
                  >
                    {sheet ? (
                      <>
                        <FilePlus /> {t('createNew')}
                      </>
                    ) : (
                      <>
                        <ExternalLink /> {t('openInSheets')}
                      </>
                    )}
                  </Button>
                )}
                {sheet && (
                  <Button asChild>
                    <a
                      href={sheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink /> {t('openExisting')}
                    </a>
                  </Button>
                )}
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

type JerseyOrderExportProps = React.ComponentProps<typeof JerseyOrderDialog>;

/** Only the super admin and the captain organise jersey orders. */
export default function JerseyOrderExport(props: JerseyOrderExportProps) {
  const { isAdmin, isCaptain } = usePermissions();

  return isAdmin || isCaptain ? <JerseyOrderDialog {...props} /> : null;
}
