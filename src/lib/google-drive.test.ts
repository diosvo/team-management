import type { MockInstance } from 'vitest';

import {
  addCheckboxes,
  DRIVE_CHANNEL,
  driveAuthUrl,
  type DriveMessage,
  GOOGLE_SHEET_MIME,
  goToSheet,
  openSheetTab,
  protectRanges,
  resetGoogleDrive,
  shareWithAnyone,
  uploadAsGoogleSheet,
} from './google-drive';

/** Plays the callback tab: talks on the same channel as the dialog. */
const callbackTab = () => {
  const channel = new BroadcastChannel(DRIVE_CHANNEL);
  const received: Array<DriveMessage> = [];
  channel.onmessage = ({ data }: MessageEvent<DriveMessage>) =>
    received.push(data);
  return { channel, received };
};

const stateOf = (url: string) =>
  new URLSearchParams(new URL(url, 'http://localhost').hash.slice(1)).get(
    'state',
  ) ?? new URL(url).searchParams.get('state')!;

describe('google-drive', () => {
  let open: MockInstance<typeof window.open>;

  beforeEach(() => {
    open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
  });

  afterEach(() => {
    resetGoogleDrive();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('driveAuthUrl', () => {
    test('asks for drive.file with a token redirect to the callback page', () => {
      const url = new URL(driveAuthUrl('client', 'abc'));

      expect(url.origin + url.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        client_id: 'client',
        redirect_uri: 'http://localhost:3000/google-callback',
        response_type: 'token',
        scope: 'https://www.googleapis.com/auth/drive.file',
        state: 'abc',
      });
    });
  });

  describe('openSheetTab', () => {
    test('returns null when the browser blocks the tab', () => {
      open.mockReturnValue(null);

      expect(openSheetTab('client')).toBeNull();
    });

    test('sends the tab to Google sign-in and resolves with its token', async () => {
      const tab = openSheetTab('client')!;
      const url = String(open.mock.calls[0]?.[0]);
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');

      const { channel } = callbackTab();
      channel.postMessage({
        state: stateOf(url),
        type: 'token',
        token: 'token',
        expiresIn: 3600,
      } satisfies DriveMessage);

      await expect(tab.token).resolves.toBe('token');
      channel.close();
    });

    test('cuts the new tab off from this page', () => {
      const opened = { opener: window } as unknown as Window;
      open.mockReturnValue(opened);

      openSheetTab('client');

      expect(opened.opener).toBeNull();
    });

    test('rejects when Google sign-in never answers', async () => {
      vi.useFakeTimers();
      const tab = openSheetTab('client')!;
      const rejected = expect(tab.token).rejects.toThrow(
        'Google sign-in timed out',
      );

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      await rejected;
      vi.useRealTimers();
    });

    test('rejects when the user denies access', async () => {
      const tab = openSheetTab('client')!;
      const { channel } = callbackTab();
      channel.postMessage({
        state: stateOf(String(open.mock.calls[0]?.[0])),
        type: 'error',
        error: 'access_denied',
      } satisfies DriveMessage);

      await expect(tab.token).rejects.toThrow('access_denied');
      channel.close();
    });

    test('ignores messages for another export', async () => {
      const tab = openSheetTab('client')!;
      const { channel } = callbackTab();
      channel.postMessage({
        state: 'other',
        type: 'token',
        token: 'wrong',
        expiresIn: 3600,
      } satisfies DriveMessage);
      channel.postMessage({
        state: stateOf(String(open.mock.calls[0]?.[0])),
        type: 'token',
        token: 'right',
        expiresIn: 3600,
      } satisfies DriveMessage);

      await expect(tab.token).resolves.toBe('right');
      channel.close();
    });

    test('reuses a live token and opens the callback page directly', async () => {
      const first = openSheetTab('client')!;
      const { channel } = callbackTab();
      channel.postMessage({
        state: stateOf(String(open.mock.calls[0]?.[0])),
        type: 'token',
        token: 'token',
        expiresIn: 3600,
      } satisfies DriveMessage);
      await first.token;

      const second = openSheetTab('client')!;

      expect(String(open.mock.calls[1]?.[0])).toMatch(
        /^\/google-callback#state=/,
      );
      await expect(second.token).resolves.toBe('token');
      channel.close();
    });

    test('sends the sheet URL, and replays it when the tab loads late', async () => {
      const tab = openSheetTab('client')!;
      const state = stateOf(String(open.mock.calls[0]?.[0]));

      tab.open('https://sheet');
      // The callback page starts listening only now.
      const { channel, received } = callbackTab();
      channel.postMessage({ state, type: 'ready' } satisfies DriveMessage);

      await vi.waitFor(() =>
        expect(received).toContainEqual({
          state,
          type: 'open',
          url: 'https://sheet',
        }),
      );
      channel.close();
    });

    test('stops answering the tab a minute after finishing', async () => {
      vi.useFakeTimers();
      const close = vi.spyOn(BroadcastChannel.prototype, 'close');
      const tab = openSheetTab('client')!;

      tab.open('https://sheet');
      expect(close).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(close).toHaveBeenCalled();
      vi.useRealTimers();
    });

    test('tells the tab when the upload failed', async () => {
      const { channel, received } = callbackTab();
      const tab = openSheetTab('client')!;
      const state = stateOf(String(open.mock.calls[0]?.[0]));

      tab.fail();

      await vi.waitFor(() =>
        expect(received).toContainEqual({ state, type: 'fail' }),
      );
      channel.close();
    });
  });

  describe('goToSheet', () => {
    test('replaces the callback page with the sheet', () => {
      goToSheet('#sheet');

      expect(window.location.hash).toBe('#sheet');
    });
  });

  describe('uploadAsGoogleSheet', () => {
    const file = new Blob(['xlsx'], { type: 'application/xlsx' });

    test('keeps the cached token when Drive fails for another reason', async () => {
      const { channel } = callbackTab();
      openSheetTab('client');
      channel.postMessage({
        state: stateOf(String(open.mock.calls[0]?.[0])),
        type: 'token',
        token: 'token',
        expiresIn: 3600,
      } satisfies DriveMessage);
      await vi.waitFor(() => {
        openSheetTab('client');
        expect(String(open.mock.lastCall?.[0])).toMatch(/^\/google-callback/);
      });
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 500 })),
      );

      await expect(uploadAsGoogleSheet('token', file, 'Form')).rejects.toThrow(
        '500',
      );
      openSheetTab('client');
      expect(String(open.mock.lastCall?.[0])).toMatch(/^\/google-callback/);
      channel.close();
    });

    test('uploads as a Google Sheet and returns its link', async () => {
      const fetch = vi.fn(
        async () =>
          new Response(
            JSON.stringify({ id: 'abc', webViewLink: 'https://sheet' }),
          ),
      );
      vi.stubGlobal('fetch', fetch);

      expect(await uploadAsGoogleSheet('token', file, 'Form')).toEqual({
        id: 'abc',
        url: 'https://sheet',
      });

      const [url, init] = fetch.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toContain('uploadType=multipart');
      expect(init.headers).toMatchObject({
        Authorization: 'Bearer token',
        'Content-Type': expect.stringMatching(/^multipart\/related; boundary=/),
      });
      const body = await (init.body as Blob).text();
      expect(body).toContain(
        JSON.stringify({ name: 'Form', mimeType: GOOGLE_SHEET_MIME }),
      );
      expect(body).toContain('xlsx');
    });

    test('builds the link from the id when Drive omits it', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ id: 'abc' }))),
      );

      expect(await uploadAsGoogleSheet('token', file, 'Form')).toEqual({
        id: 'abc',
        url: 'https://docs.google.com/spreadsheets/d/abc/edit',
      });
    });

    test('drops the cached token when Drive rejects it', async () => {
      openSheetTab('client');
      const { channel } = callbackTab();
      channel.postMessage({
        state: stateOf(String(open.mock.calls[0]?.[0])),
        type: 'token',
        token: 'token',
        expiresIn: 3600,
      } satisfies DriveMessage);
      await vi.waitFor(() => {
        openSheetTab('client');
        expect(String(open.mock.lastCall?.[0])).toMatch(/^\/google-callback/);
      });
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 401 })),
      );

      await expect(uploadAsGoogleSheet('token', file, 'Form')).rejects.toThrow(
        '401',
      );
      openSheetTab('client');
      expect(String(open.mock.lastCall?.[0])).toContain('accounts.google.com');
      channel.close();
    });
  });

  describe('addCheckboxes', () => {
    const RANGES = [
      { sheet: 'Đội', column: 'H', fromRow: 3, toRow: 11 },
      { sheet: 'Missing', column: 'H', fromRow: 3, toRow: 5 },
    ];

    const stubSheets = (update = new Response('{}')) => {
      const fetch = vi.fn(async (url: string) =>
        url.includes(':batchUpdate')
          ? update
          : new Response(
              JSON.stringify({
                sheets: [{ properties: { sheetId: 42, title: 'Đội' } }],
              }),
            ),
      );
      vi.stubGlobal('fetch', fetch);
      return fetch;
    };

    test('sets boolean validation on the named sheets only', async () => {
      const fetch = stubSheets();

      await addCheckboxes('token', 'abc', RANGES);

      const [url, init] = fetch.mock.calls[1] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toBe(
        'https://sheets.googleapis.com/v4/spreadsheets/abc:batchUpdate',
      );
      expect(JSON.parse(init.body as string)).toEqual({
        requests: [
          {
            setDataValidation: {
              range: {
                sheetId: 42,
                startRowIndex: 2,
                endRowIndex: 11,
                startColumnIndex: 7,
                endColumnIndex: 8,
              },
              rule: { condition: { type: 'BOOLEAN' } },
            },
          },
        ],
      });
    });

    test('skips the update when no sheet matches', async () => {
      const fetch = stubSheets();

      await addCheckboxes('token', 'abc', [RANGES[1]!]);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('throws when the Sheets API rejects the lookup', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 403 })),
      );

      await expect(addCheckboxes('token', 'abc', RANGES)).rejects.toThrow(
        '403',
      );
    });

    test('throws when the update fails', async () => {
      stubSheets(new Response(null, { status: 400 }));

      await expect(addCheckboxes('token', 'abc', RANGES)).rejects.toThrow(
        '400',
      );
    });

    test("includes Google's reason in the error", async () => {
      stubSheets(new Response('Invalid email', { status: 400 }));

      await expect(addCheckboxes('token', 'abc', RANGES)).rejects.toThrow(
        'Sheets update failed (400): Invalid email',
      );
    });
  });

  describe('protectRanges', () => {
    test('adds a protected range editable by the given emails', async () => {
      const fetch = vi.fn(async (url: string) =>
        url.includes(':batchUpdate')
          ? new Response('{}')
          : new Response(
              JSON.stringify({
                sheets: [{ properties: { sheetId: 7, title: 'Đội' } }],
              }),
            ),
      );
      vi.stubGlobal('fetch', fetch);

      await protectRanges(
        'token',
        'abc',
        [{ sheet: 'Đội', column: 'H', fromRow: 3, toRow: 11 }],
        ['me@example.com'],
        'Đã thu tiền',
      );

      const [, init] = fetch.mock.calls[1] as unknown as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        requests: [
          {
            addProtectedRange: {
              protectedRange: {
                range: {
                  sheetId: 7,
                  startRowIndex: 2,
                  endRowIndex: 11,
                  startColumnIndex: 7,
                  endColumnIndex: 8,
                },
                description: 'Đã thu tiền',
                warningOnly: false,
                editors: { users: ['me@example.com'] },
              },
            },
          },
        ],
      });
    });

    const RANGE = { sheet: 'Đội', column: 'H', fromRow: 3, toRow: 11 };

    /** Sheets that refuses any request naming one of `invalid`. */
    const stubProtect = (invalid: Array<string>, replies?: unknown) => {
      const fetch = vi.fn(async (url: string, init?: RequestInit) => {
        if (!url.includes(':batchUpdate')) {
          return new Response(
            JSON.stringify({
              sheets: [{ properties: { sheetId: 7, title: 'Đội' } }],
            }),
          );
        }
        const body = init!.body as string;
        if (invalid.some((email) => body.includes(email))) {
          return new Response('Invalid email', { status: 400 });
        }
        return new Response(
          JSON.stringify(
            body.includes('addProtectedRange')
              ? (replies ?? {
                  replies: [
                    {
                      addProtectedRange: {
                        protectedRange: { protectedRangeId: 9 },
                      },
                    },
                  ],
                })
              : {},
          ),
        );
      });
      vi.stubGlobal('fetch', fetch);
      return fetch;
    };

    const bodies = (fetch: ReturnType<typeof stubProtect>) =>
      fetch.mock.calls
        .slice(1)
        .map(([, init]) => JSON.parse((init as RequestInit).body as string));

    test('locks to the owner, then adds each editor Google accepts', async () => {
      const fetch = stubProtect(['cap@example.com']);

      expect(
        await protectRanges(
          'token',
          'abc',
          [RANGE],
          ['me@gmail.com', 'cap@example.com', 'coach@gmail.com'],
          'Đã thu tiền',
        ),
      ).toEqual(['cap@example.com']);

      const sent = bodies(fetch);
      expect(
        sent[1].requests[0].addProtectedRange.protectedRange.editors,
      ).toEqual({ users: [] });
      expect(sent.slice(2).map((body) => body.requests[0])).toEqual([
        {
          updateProtectedRange: {
            protectedRange: {
              protectedRangeId: 9,
              editors: { users: ['me@gmail.com'] },
            },
            fields: 'editors',
          },
        },
        {
          updateProtectedRange: {
            protectedRange: {
              protectedRangeId: 9,
              editors: { users: ['me@gmail.com', 'cap@example.com'] },
            },
            fields: 'editors',
          },
        },
        {
          updateProtectedRange: {
            protectedRange: {
              protectedRangeId: 9,
              editors: { users: ['me@gmail.com', 'coach@gmail.com'] },
            },
            fields: 'editors',
          },
        },
      ]);
    });

    test('adds no editors when the reply has no protected ranges', async () => {
      const fetch = stubProtect(['cap@example.com'], {});

      expect(
        await protectRanges('token', 'abc', [RANGE], ['cap@example.com'], ''),
      ).toEqual([]);
      expect(bodies(fetch)[2].requests).toEqual([]);
    });

    test('throws when locking fails without editors', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) =>
          url.includes(':batchUpdate')
            ? new Response(null, { status: 403 })
            : new Response(
                JSON.stringify({
                  sheets: [{ properties: { sheetId: 7, title: 'Đội' } }],
                }),
              ),
        ),
      );

      await expect(
        protectRanges('token', 'abc', [RANGE], [], ''),
      ).rejects.toThrow('403');
    });

    test('skips the update when no sheet matches', async () => {
      const fetch = stubProtect([]);

      expect(
        await protectRanges(
          'token',
          'abc',
          [{ ...RANGE, sheet: 'Khác' }],
          ['me@gmail.com'],
          '',
        ),
      ).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('shareWithAnyone', () => {
    test('lets anyone with the link edit', async () => {
      const fetch = vi.fn(async () => new Response('{}'));
      vi.stubGlobal('fetch', fetch);

      await shareWithAnyone('token', 'abc');

      const [url, init] = fetch.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toBe(
        'https://www.googleapis.com/drive/v3/files/abc/permissions',
      );
      expect(init.headers).toMatchObject({ Authorization: 'Bearer token' });
      expect(JSON.parse(init.body as string)).toEqual({
        type: 'anyone',
        role: 'writer',
      });
    });

    test('throws when Drive refuses', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 403 })),
      );

      await expect(shareWithAnyone('token', 'abc')).rejects.toThrow('403');
    });
  });
});
