import { StrictMode } from 'react';

import {
  DRIVE_CHANNEL,
  type DriveMessage,
  goToSheet,
} from '@/lib/google-drive';

import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import GoogleCallbackPage from './page';

vi.mock('@/lib/google-drive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/google-drive')>()),
  goToSheet: vi.fn(),
}));

/** Plays the dialog's tab on the shared channel. */
const dialogTab = () => {
  const channel = new BroadcastChannel(DRIVE_CHANNEL);
  const received: Array<DriveMessage> = [];
  channel.onmessage = ({ data }: MessageEvent<DriveMessage>) =>
    received.push(data);
  return { channel, received };
};

const land = (hash: string) => {
  window.history.replaceState(null, '', `/google-callback#${hash}`);
  return renderWithUI(<GoogleCallbackPage />);
};

describe('GoogleCallbackPage', () => {
  let tab: ReturnType<typeof dialogTab>;

  beforeEach(() => {
    tab = dialogTab();
  });

  afterEach(() => tab.channel.close());

  setupTestLifecycle();

  test('should be accessible', async () => {
    land('state=abc');

    await expectNoA11yViolations();
  });

  test('hands the token over, strips it from the URL and waits', async () => {
    land('state=abc&access_token=secret&expires_in=3599');

    expect(
      screen.getByText('Preparing your Google Sheet…'),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    await waitFor(() =>
      expect(tab.received).toEqual([
        { state: 'abc', type: 'token', token: 'secret', expiresIn: 3599 },
        { state: 'abc', type: 'ready' },
      ]),
    );
  });

  test('goes to the sheet when the upload finishes', async () => {
    land('state=abc');

    tab.channel.postMessage({
      state: 'abc',
      type: 'open',
      url: 'https://sheet',
    } satisfies DriveMessage);

    await waitFor(() =>
      expect(goToSheet).toHaveBeenCalledWith('https://sheet'),
    );
  });

  test('ignores another export', async () => {
    land('state=abc');

    tab.channel.postMessage({
      state: 'other',
      type: 'open',
      url: 'https://elsewhere',
    } satisfies DriveMessage);
    tab.channel.postMessage({ state: 'abc', type: 'ready' } as DriveMessage);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(goToSheet).not.toHaveBeenCalled();
  });

  test('reports a denied sign-in', async () => {
    land('state=abc&error=access_denied');

    expect(
      await screen.findByText(/Could not create the Google Sheet/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(tab.received).toContainEqual({
        state: 'abc',
        type: 'error',
        error: 'access_denied',
      }),
    );
  });

  test('shows the failure when the upload fails', async () => {
    land('state=abc');

    tab.channel.postMessage({
      state: 'abc',
      type: 'fail',
    } satisfies DriveMessage);

    expect(
      await screen.findByText(/Could not create the Google Sheet/),
    ).toBeInTheDocument();
  });

  test('has nothing to do when opened directly', () => {
    land('');

    expect(
      screen.getByText(/Could not create the Google Sheet/),
    ).toBeInTheDocument();
  });

  // Strict Mode re-runs effects; the first run strips the fragment.
  test('keeps working when effects run twice in development', async () => {
    window.history.replaceState(
      null,
      '',
      '/google-callback#state=abc&access_token=secret&expires_in=3599',
    );
    renderWithUI(
      <StrictMode>
        <GoogleCallbackPage />
      </StrictMode>,
    );

    expect(
      screen.getByText('Preparing your Google Sheet…'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(tab.received).toContainEqual({
        state: 'abc',
        type: 'token',
        token: 'secret',
        expiresIn: 3599,
      }),
    );

    tab.channel.postMessage({
      state: 'abc',
      type: 'open',
      url: 'https://sheet',
    } satisfies DriveMessage);
    await waitFor(() =>
      expect(goToSheet).toHaveBeenCalledWith('https://sheet'),
    );
    expect(
      screen.queryByText(/Could not create the Google Sheet/),
    ).not.toBeInTheDocument();
  });

  test('shows why the upload failed', async () => {
    land('state=abc');

    tab.channel.postMessage({
      state: 'abc',
      type: 'fail',
      reason: 'Drive upload failed (403)',
    } satisfies DriveMessage);

    expect(
      await screen.findByText('Drive upload failed (403)'),
    ).toBeInTheDocument();
  });
});
