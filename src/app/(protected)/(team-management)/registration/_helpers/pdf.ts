import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFTextField, rgb } from 'pdf-lib';

import { triggerDownload, withExtension } from '@/lib/download';

import type { League } from '@/drizzle/schema';
import type { User } from '@/drizzle/schema/user';

/**
 * @description Columns extracted for every player. The order is also the column
 * order used by the default (generated-from-scratch) form.
 */
export const COLUMNS = [
  { key: 'name', header: 'Họ tên', width: 200 },
  { key: 'dob', header: 'Năm sinh', width: 70 },
  { key: 'cmnd', header: 'CCCD', width: 110 },
  { key: 'phone', header: 'Điện thoại', width: 90 },
  { key: 'jersey', header: 'Số áo', width: 50 },
] as const;

type ColumnKey = (typeof COLUMNS)[number]['key'];

/**
 * @description Field-name patterns used to auto-map an uploaded AcroForm's
 * fields to player data. Matched (via `.test`, so substrings count) against a
 * normalized, diacritics-stripped field name.
 *
 * @example "Họ và tên", "hoTen", "full_name" all map to `name`.
 */
const FIELD_PATTERNS: Record<ColumnKey, RegExp> = {
  name: /(hoten|hovaten|name)/,
  dob: /(ngaysinh|dob|birth|nam)/,
  cmnd: /(cmnd|cccd|citizen|cancuoc)/,
  phone: /(dienthoai|sdt|phone|tel|mobile)/,
  jersey: /(soao|jersey|number)/,
};

/** @description Lowercase, strip diacritics and any non-alphanumeric symbols. */
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const fontCache = new Map<string, ArrayBuffer>();

const loadFont = async (file: string): Promise<ArrayBuffer> => {
  const cached = fontCache.get(file);
  if (cached) return cached;

  const res = await fetch(`/fonts/${file}`);
  if (!res.ok) throw new Error('Could not load the PDF font.');

  const bytes = await res.arrayBuffer();
  fontCache.set(file, bytes);
  return bytes;
};

const embedFont = async (pdf: PDFDocument, file: string) =>
  pdf.embedFont(await loadFont(file), { subset: false });

const birthYear = (player: User) =>
  player.dob ? String(new Date(player.dob).getFullYear()) : '';

export const toRow = (player: User): Record<ColumnKey, string> => ({
  name: player.name ?? '',
  dob: birthYear(player),
  cmnd: player.citizen_identification ?? '',
  phone: player.phone_number ?? '',
  jersey: player.player?.jersey_number?.toString() ?? '',
});

const TEAM_NAME = 'Saigon Rovers Basketball Club';
const PDF_TITLE = 'HỒ SƠ ĐĂNG KÝ BÓNG RỔ';

const BLACK = rgb(0, 0, 0);
const BORDER = rgb(0.2, 0.2, 0.2);

/**
 * Generate a roster PDF from scratch. Used when no template is uploaded.
 */
export const generateDefaultRosterPdf = async (
  players: Array<User>,
  league?: League,
): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [font, boldFont] = await Promise.all([
    embedFont(pdf, 'GoogleSans-Regular.ttf'),
    embedFont(pdf, 'GoogleSans-Bold.ttf'),
  ]);

  const PAGE_W = 595;
  const PAGE_H = 842; // A4 portrait
  const margin = 40;
  const contentW = PAGE_W - margin * 2;

  let page = pdf.addPage([PAGE_W, PAGE_H]);

  const drawText = (
    value: string,
    x: number,
    top: number,
    { f = font, size = 11, color = BLACK } = {},
  ) => page.drawText(value, { x, y: top - size, size, font: f, color });

  const drawField = (
    x: number,
    top: number,
    label: string,
    value: string,
    { size = 11, labelFont = font } = {},
  ) => {
    drawText(label, x, top, { f: labelFont, size });
    if (value) {
      const labelW = labelFont.widthOfTextAtSize(label, size);
      drawText(value, x + labelW + 4, top, { size });
    }
  };

  // Centered text helper for title / subtitle.
  const drawCentered = (
    value: string,
    top: number,
    f: typeof font,
    size: number,
  ) =>
    drawText(value, (PAGE_W - f.widthOfTextAtSize(value, size)) / 2, top, {
      f,
      size,
    });

  let y = PAGE_H - margin;

  // Title + optional league subtitle.
  const titleSize = 24;
  drawCentered(PDF_TITLE, y, boldFont, titleSize);
  y -= titleSize + 10;

  if (league?.name) drawCentered(league.name, y, font, 20);
  y -= 56;

  // Team / coach / captain block.
  drawField(margin, y, 'Tên Đội: ', TEAM_NAME, { size: 14 });
  y -= 24;
  drawField(margin, y, 'Huấn luyện viên: ', '', { size: 12 });
  y -= 22;

  const captain = players.find((player) => player.player?.is_captain);
  drawField(margin, y, 'Đội Trưởng: ', captain?.name ?? '', { size: 12 });
  drawField(margin + 290, y, 'Điện thoại: ', captain?.phone_number ?? '', {
    size: 12,
  });
  y -= 40;

  // Player cards (two columns).
  const COLS = 2;
  const colGap = 24;
  const colW = (contentW - colGap) / COLS;
  const photoW = 63;
  const photoH = 84; // 3:4 placeholder, fixed height even when empty
  const lineGap = 17;
  const cardH = Math.max(photoH, lineGap * 5);
  const rowGap = 22;

  const drawCard = (player: User, x: number, top: number) => {
    // Fixed-size 3:4 photo placeholder.
    page.drawRectangle({
      x,
      y: top - photoH,
      width: photoW,
      height: photoH,
      borderWidth: 1,
      borderColor: BORDER,
    });

    const row = toRow(player);
    const textX = x + photoW + 12;
    const fields: Array<[string, string]> = [
      ['Họ tên: ', row.name],
      ['Năm sinh: ', row.dob],
      ['CMND: ', row.cmnd],
      ['Điện thoại: ', row.phone],
      ['Số áo: ', row.jersey],
    ];
    fields.forEach(([label, value], i) =>
      drawField(textX, top - i * lineGap, label, value),
    );
  };

  for (let i = 0; i < players.length; i += COLS) {
    if (y - cardH < margin) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - margin;
    }
    for (let col = 0; col < COLS; col++) {
      const player = players[i + col];
      if (!player) break;
      drawCard(player, margin + col * (colW + colGap), y);
    }
    y -= cardH + rowGap;
  }

  return pdf.save();
};

export interface FillResult {
  bytes: Uint8Array;
  detectedFields: Array<string>;
  filledCount: number;
}

/**
 * @description Fill an uploaded AcroForm in place by matching each text field's
 * name to a player column (see FIELD_PATTERNS). Used when the upload has form
 * fields.
 */
const fillUploadedFormPdf = async (
  pdf: PDFDocument,
  fields: ReturnType<ReturnType<PDFDocument['getForm']>['getFields']>,
  players: Array<User>,
): Promise<FillResult> => {
  pdf.registerFontkit(fontkit);
  const font = await embedFont(pdf, 'GoogleSans-Regular.ttf');

  const rows = players.map(toRow);
  const columnKeys = Object.keys(FIELD_PATTERNS) as Array<ColumnKey>;
  let filledCount = 0;

  for (const field of fields) {
    if (!(field instanceof PDFTextField)) continue;

    const rawName = field.getName();
    const norm = normalize(rawName);

    // Which column does this field represent?
    const column = columnKeys.find((key) => FIELD_PATTERNS[key].test(norm));
    if (!column) continue;

    // Which player row? First digit group in the name, else first player.
    const match = rawName.match(/\d+/);
    const row = rows[match ? Number(match[0]) - 1 : 0];
    if (!row) continue;

    field.setText(row[column]);
    field.updateAppearances(font);
    filledCount += 1;
  }

  // Keep the form interactive while ensuring Vietnamese glyphs render.
  pdf.getForm().updateFieldAppearances(font);

  return {
    bytes: await pdf.save(),
    detectedFields: fields.map((f) => f.getName()),
    filledCount,
  };
};

export interface BuildPdfOptions {
  players: Array<User>;
  league?: League;
  template?: File;
}

/**
 * @description Single entry point used by both Preview and Export. The output
 * always reflects only the current league/selection.
 * - With an uploaded form that has fillable fields, those fields are filled.
 * - Otherwise (no template, or a non-fillable upload) the default roster is
 *   generated from scratch.
 */
export const buildRegistrationPdf = async ({
  players,
  league,
  template,
}: BuildPdfOptions): Promise<FillResult> => {
  const generateRoster = async (): Promise<FillResult> => ({
    bytes: await generateDefaultRosterPdf(players, league),
    detectedFields: [],
    filledCount: players.length,
  });

  if (!template) return generateRoster();

  const pdf = await PDFDocument.load(await template.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const fields = pdf.getForm().getFields();

  // Non-fillable uploads can't be mapped to player data, so fall back to the
  // generated roster for the current league instead of appending the upload.
  return fields.length > 0
    ? fillUploadedFormPdf(pdf, fields, players)
    : generateRoster();
};

const escapeCsv = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const buildRosterCsv = (players: Array<User>): string =>
  [
    COLUMNS.map((column) => column.header).join(','),
    ...players.map((player) => {
      const row = toRow(player);
      return COLUMNS.map((column) => escapeCsv(row[column.key])).join(',');
    }),
  ].join('\n');

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const downloadPdf = (bytes: Uint8Array, filename: string) =>
  triggerDownload(
    new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    withExtension(filename, '.pdf'),
  );

export const downloadCsv = (players: Array<User>, filename: string) =>
  triggerDownload(
    new Blob(['\uFEFF' + buildRosterCsv(players)], {
      type: 'text/csv;charset=utf-8',
    }),
    withExtension(filename, '.csv'),
  );
