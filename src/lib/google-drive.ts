/**
 * Browser-only Google Drive upload. The user grants the `drive.file` scope
 * (only files this app creates), and the upload converts the file to a native
 * Google Sheet.
 *
 * Everything happens in one tab opened straight from the click: it signs in
 * with Google (a full-page redirect, so no popup can be blocked), lands on
 * `GOOGLE_CALLBACK_PATH`, and finally navigates to the new sheet. The two tabs
 * talk over a `BroadcastChannel`, because Google's pages cut the opener link.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
export const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';

export const GOOGLE_CALLBACK_PATH = '/google-callback';
export const DRIVE_CHANNEL = 'rovers-google-drive';
// Give up if the user leaves the Google sign-in tab open without answering.
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;

/** Messages between the dialog and the callback tab, keyed by `state`. */
export type DriveMessage = { state: string } & (
  | { type: 'ready' }
  | { type: 'token'; token: string; expiresIn: number }
  | { type: 'error'; error: string }
  | { type: 'open'; url: string }
  | { type: 'fail'; reason?: string }
);

let cachedToken: Nullable<{ value: string; expiresAt: number }> = null;

const liveToken = () =>
  cachedToken && cachedToken.expiresAt > Date.now() ? cachedToken.value : null;

/** Leaves the callback tab for the finished sheet (a seam for tests). */
export const goToSheet = (url: string) => window.location.replace(url);

export const driveRedirectUri = () =>
  `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;

export function driveAuthUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: driveRedirectUri(),
    response_type: 'token',
    scope: DRIVE_FILE_SCOPE,
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

export type SheetTab = {
  /** Resolves once Google granted access (at once when a token is cached). */
  token: Promise<string>;
  /** Sends the tab to the finished sheet. */
  open: (url: string) => void;
  /** Tells the tab the upload failed, and why when known. */
  fail: (reason?: string) => void;
};

/**
 * Opens the tab that ends on the sheet. Call it synchronously from the click
 * handler; returns `null` when the browser still blocks the tab.
 */
export function openSheetTab(clientId: string): Nullable<SheetTab> {
  const state = crypto.randomUUID();
  const cached = liveToken();

  const tab = window.open(
    cached
      ? `${GOOGLE_CALLBACK_PATH}#state=${state}`
      : driveAuthUrl(clientId, state),
    '_blank',
  );
  if (!tab) return null;

  // Sever the opener manually; `noopener` can hide browser blocking.
  tab.opener = null;

  const channel = new BroadcastChannel(DRIVE_CHANNEL);
  let outcome: Nullable<DriveMessage> = null;
  let onToken: Nullable<(message: DriveMessage) => void> = null;

  channel.onmessage = ({ data }: MessageEvent<DriveMessage>) => {
    if (data?.state !== state) return;
    // The tab may load after the upload finished; replay the outcome.
    if (data.type === 'ready' && outcome) channel.postMessage(outcome);
    onToken?.(data);
  };

  const token = cached
    ? Promise.resolve(cached)
    : new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Google sign-in timed out')),
          SIGN_IN_TIMEOUT_MS,
        );
        onToken = (message) => {
          if (message.type === 'token') {
            clearTimeout(timeout);
            // Refresh a minute early so an upload never races the expiry.
            cachedToken = {
              value: message.token,
              expiresAt: Date.now() + (message.expiresIn - 60) * 1000,
            };
            resolve(message.token);
          } else if (message.type === 'error') {
            clearTimeout(timeout);
            reject(new Error(message.error));
          }
        };
      });

  const finish = (message: DriveMessage) => {
    outcome = message;
    channel.postMessage(message);
    // Keep answering a late `ready` for a while, then let go.
    setTimeout(() => channel.close(), 60_000);
  };

  return {
    token,
    open: (url) => finish({ state, type: 'open', url }),
    fail: (reason) => finish({ state, type: 'fail', reason }),
  };
}

/** Uploads `file` to the user's Drive as a Google Sheet. */
export async function uploadAsGoogleSheet(
  token: string,
  file: Blob,
  name: string,
): Promise<{ id: string; url: string }> {
  const boundary = `rovers-${crypto.randomUUID()}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name, mimeType: GOOGLE_SHEET_MIME }),
    `\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    // A revoked or expired token must not be reused on the next try.
    if (response.status === 401) cachedToken = null;
    throw new Error(`Drive upload failed (${response.status})`);
  }

  const { id, webViewLink } = (await response.json()) as {
    id: string;
    webViewLink?: string;
  };
  return {
    id,
    url: webViewLink ?? `https://docs.google.com/spreadsheets/d/${id}/edit`,
  };
}

/**
 * Lets anyone with the link edit the file, so players can fill in their own
 * rows without being invited one by one. `drive.file` covers it because the
 * app created the file.
 */
export async function shareWithAnyone(
  token: string,
  fileId: string,
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'anyone', role: 'writer' }),
    },
  );
  if (!response.ok) throw new Error(`Sharing failed (${response.status})`);
}

export type CheckboxRange = {
  sheet: string;
  column: string;
  // 1-based and inclusive.
  fromRow: number;
  toRow: number;
};

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const columnIndex = (letter: string) =>
  [...letter.toUpperCase()].reduce(
    (index, char) => index * 26 + char.charCodeAt(0) - 64,
    0,
  ) - 1;

/** Sheet title → numeric `sheetId`, which batch updates address ranges by. */
async function sheetIdsOf(token: string, spreadsheetId: string) {
  const meta = await fetch(
    `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!meta.ok) throw new Error(`Sheets lookup failed (${meta.status})`);

  const { sheets } = (await meta.json()) as {
    sheets: Array<{ properties: { sheetId: number; title: string } }>;
  };
  return new Map(
    sheets.map(({ properties }) => [properties.title, properties.sheetId]),
  );
}

/** Applies one request per range that exists in the spreadsheet. */
async function updateRanges(
  token: string,
  spreadsheetId: string,
  ranges: Array<CheckboxRange>,
  request: (range: GridRange) => Record<string, unknown>,
): Promise<void> {
  const sheetIds = await sheetIdsOf(token, spreadsheetId);

  const requests = ranges.flatMap(({ sheet, column, fromRow, toRow }) => {
    const sheetId = sheetIds.get(sheet);
    if (sheetId === undefined) return [];
    const col = columnIndex(column);
    return [
      request({
        sheetId,
        startRowIndex: fromRow - 1,
        endRowIndex: toRow,
        startColumnIndex: col,
        endColumnIndex: col + 1,
      }),
    ];
  });
  if (requests.length === 0) return;

  const update = await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
  if (!update.ok) throw new Error(`Sheets update failed (${update.status})`);
}

type GridRange = {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
};

/**
 * Turns ranges of a converted sheet into checkboxes, which `.xlsx` can't
 * express. Needs the Google Sheets API enabled; `drive.file` covers the call
 * because the app created the file.
 */
export function addCheckboxes(
  token: string,
  spreadsheetId: string,
  ranges: Array<CheckboxRange>,
): Promise<void> {
  return updateRanges(token, spreadsheetId, ranges, (range) => ({
    setDataValidation: { range, rule: { condition: { type: 'BOOLEAN' } } },
  }));
}

/**
 * Locks ranges so only `editors` (Google account emails) can change them; the
 * owner always can. Everyone else with the link sees them read-only.
 */
export function protectRanges(
  token: string,
  spreadsheetId: string,
  ranges: Array<CheckboxRange>,
  editors: Array<string>,
  description: string,
): Promise<void> {
  return updateRanges(token, spreadsheetId, ranges, (range) => ({
    addProtectedRange: {
      protectedRange: {
        range,
        description,
        warningOnly: false,
        editors: { users: editors },
      },
    },
  }));
}

/** Test hook: forget the cached token. */
export function resetGoogleDrive() {
  cachedToken = null;
}
