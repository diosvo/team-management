'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Center, Code, Spinner, Stack, Text } from '@chakra-ui/react';

import {
  DRIVE_CHANNEL,
  type DriveMessage,
  goToSheet,
} from '@/lib/google-drive';

/** Google's answer from the URL fragment; empty while rendering on the server. */
const readLanding = () =>
  new URLSearchParams(
    typeof window === 'undefined' ? '' : window.location.hash.slice(1),
  );

/**
 * Lands here from Google sign-in (or straight from the jersey form when a
 * token is cached), hands the token to the dialog's tab, and waits to be sent
 * to the finished Google Sheet.
 */
export default function GoogleCallbackPage() {
  const t = useTranslations('roster.jerseyOrder');
  // Read once per mount: Strict Mode runs the effect twice, and the first run
  // strips the fragment from the URL.
  const [params] = useState(readLanding);
  // `null` while waiting; otherwise why it failed ('' when unknown).
  const [failure, setFailure] = useState<Nullable<string>>(null);

  useEffect(() => {
    const state = params.get('state');
    // Keep the access token out of history and the address bar.
    window.history.replaceState(null, '', window.location.pathname);

    if (!state) {
      // Opened directly, nothing to wait for.
      setFailure('');
      return;
    }

    const channel = new BroadcastChannel(DRIVE_CHANNEL);
    channel.onmessage = ({ data }: MessageEvent<DriveMessage>) => {
      if (data?.state !== state) return;
      if (data.type === 'open') goToSheet(data.url);
      if (data.type === 'fail') setFailure(data.reason ?? '');
    };

    const token = params.get('access_token');
    const error = params.get('error');
    if (token) {
      channel.postMessage({
        state,
        type: 'token',
        token,
        expiresIn: Number(params.get('expires_in') ?? 0),
      } satisfies DriveMessage);
    } else if (error) {
      channel.postMessage({
        state,
        type: 'error',
        error,
      } satisfies DriveMessage);
      setFailure(error);
    }
    channel.postMessage({ state, type: 'ready' } satisfies DriveMessage);

    return () => channel.close();
  }, [params]);

  return (
    <Center minHeight="100dvh" padding={4}>
      {failure !== null ? (
        <Stack alignItems="center" gap={3}>
          <Text color="fg.muted">{t('tabFailed')}</Text>
          {failure && <Code>{failure}</Code>}
        </Stack>
      ) : (
        <Stack alignItems="center" gap={3}>
          <Spinner size="lg" />
          <Text color="fg.muted">{t('preparing')}</Text>
        </Stack>
      )}
    </Center>
  );
}
