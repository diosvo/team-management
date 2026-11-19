import type { StaticImageData } from 'next/image';
import type { DataValidation, Font, Workbook, Worksheet } from 'exceljs';

import { JERSEY_SIZES, type JerseySize, type ShortForm } from '@/utils/enum';

import type { CheckboxRange } from '@/lib/google-drive';

import hoopsExclusiveShort from '@/assets/providers/hoops/exclusive-short.webp';
import hoopsSizeChart from '@/assets/providers/hoops/size-chart.webp';
import hoopsStandardShort from '@/assets/providers/hoops/standard-short.webp';

/**
 * Builds the jersey-order workbook players fill in together. Vietnamese
 * headers mirror the club's existing Google Sheet, like the registration
 * export does. Kept free of a static `exceljs` import: the caller passes a
 * `Workbook` so the engine is only loaded when someone actually exports.
 */

type ChartSource = { title: string; image: StaticImageData | string };

export type UniformProvider = {
  name: string;
  // Embedded into the "Bảng size" tab, each under its title, in this order.
  charts: Array<ChartSource>;
};

export const DEFAULT_PROVIDER = 'Hoops';
// Catch-all for providers without a chart; the dialog translates its label.
export const OTHER_PROVIDER = 'Khác';

export const UNIFORM_PROVIDERS: Array<UniformProvider> = [
  {
    name: DEFAULT_PROVIDER,
    charts: [
      { title: 'Size đồ', image: hoopsSizeChart },
      { title: 'Size quần ngắn', image: hoopsExclusiveShort },
      { title: 'Size quần dài', image: hoopsStandardShort },
    ],
  },
  { name: 'Versus', charts: [] },
  { name: OTHER_PROVIDER, charts: [] },
];

// How the short type reads on the form, in the club's own words.
export const SHORT_FORM_LABELS: Record<ShortForm, string> = {
  short: 'Form ngắn',
  standard: 'Form tiêu chuẩn',
};
export const PANTS_FORMS = Object.values(SHORT_FORM_LABELS);
export const DEFAULT_JERSEY_PRICE = 360_000;

export const SHEET = {
  TEAM: 'Đội',
  OUTSIDE: 'Ngoài đội',
  SIZES: 'Bảng size',
  DESIGN: 'Mẫu đồ',
} as const;

export type JerseyOrderPlayer = {
  name: string;
  jersey_number: Nullish<number>;
  jersey_name: Nullish<string>;
  shirt_size?: Nullish<JerseySize>;
  short_size?: Nullish<JerseySize>;
  short_form?: Nullish<ShortForm>;
};

export type SizeChart = {
  title: string;
  // PNG bytes; exceljs can't embed the WebP sources.
  buffer: ArrayBuffer;
  width: number;
  height: number;
};

export type JerseyOrderOptions = {
  players: Array<JerseyOrderPlayer>;
  provider: string;
  price: number;
};

const HEADERS = [
  { header: 'STT', width: 6 },
  { header: 'Tên', width: 26 },
  { header: 'Số áo', width: 8 },
  { header: 'Tên trên áo', width: 20 },
  { header: 'Size áo', width: 10 },
  { header: 'Size quần', width: 10 },
  { header: 'Loại quần', width: 18 },
  { header: 'Đã thu tiền', width: 12 },
  { header: 'Note', width: 32 },
];
const LAST_COLUMN = 'I';
const PAID_COLUMN = 'H';

// Rows 1-2 hold the banner and headers; orders start on row 3.
const FIRST_ROW = 3;
const SPARE_TEAM_ROWS = 5;
const OUTSIDE_ROWS = 30;

/**
 * Where "Đã thu tiền" holds TRUE/FALSE. Excel files can't carry checkbox
 * cells, so Google Sheets turns these ranges into checkboxes after upload.
 */
export const paidCheckboxRanges = (
  playerCount: number,
): Array<CheckboxRange> => [
  {
    sheet: SHEET.TEAM,
    column: PAID_COLUMN,
    fromRow: FIRST_ROW,
    toRow: FIRST_ROW + playerCount + SPARE_TEAM_ROWS - 1,
  },
  {
    sheet: SHEET.OUTSIDE,
    column: PAID_COLUMN,
    fromRow: FIRST_ROW,
    toRow: FIRST_ROW + OUTSIDE_ROWS - 1,
  },
];

const SIZE_CHART_MAX_WIDTH = 900;
// Default Excel/Sheets row height, used to stack charts without overlap.
const ROW_HEIGHT_PX = 20;

const COLOR = {
  HEADER: 'FF8B1A12',
  MONEY_HEADER: 'FFFFFF00',
  BANNER: 'FFFFF2CC',
  DUPLICATE: 'FFFCE5CD',
  PAID: 'FFD9EAD3',
  SHORT: 'FFFFF2CC',
  STANDARD: 'FFCFE2F3',
  SUMMARY: 'FFF6B26B',
  BORDER: 'FFD9D9D9',
};

const FONT: Partial<Font> = { name: 'Arial', size: 10 };
const MONEY_FORMAT = '#,##0';

const fill = (argb: string) =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } }) as const;

// Conditional formats read `bgColor`; cell fills read `fgColor`.
const highlight = (argb: string) => ({
  fill: { ...fill(argb), bgColor: { argb } },
});

const border = { style: 'thin', color: { argb: COLOR.BORDER } } as const;
const box = { top: border, left: border, bottom: border, right: border };

/**
 * Adds a dropdown to a whole range. Per-cell `cell.dataValidation` makes
 * exceljs merge cells into overlapping ranges (it sorts "E10" before "E3"),
 * which spreadsheet apps drop, so ranges go straight into the sheet model.
 */
function dropdown(
  sheet: Worksheet,
  range: string,
  values: Array<string>,
): void {
  const validations = (
    sheet as unknown as {
      dataValidations: { add(range: string, rule: DataValidation): void };
    }
  ).dataValidations;

  validations.add(range, {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    formulae: [`"${values.join(',')}"`],
  });
}

/** Team players by jersey number, unnumbered players last. Copies before
 * sorting (no `toSorted`, which ES2022 targets lack) so the input is kept. */
export const sortPlayers = (players: Array<JerseyOrderPlayer>) =>
  [...players].sort(
    (a, b) =>
      (a.jersey_number ?? Infinity) - (b.jersey_number ?? Infinity) ||
      a.name.localeCompare(b.name, 'vi'),
  );

export const jerseyOrderFilename = (date = new Date()) =>
  `[Rovers] Đặt đồ - ${date.getFullYear()}`;

function addOrderSheet(
  workbook: Workbook,
  name: string,
  banner: string,
  players: Array<JerseyOrderPlayer>,
  blankRows: number,
): { sheet: Worksheet; lastRow: number } {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 2 }],
  });
  // Column style keeps rows people add by hand in Arial too.
  sheet.columns = HEADERS.map(({ width }) => ({
    width,
    style: { font: FONT },
  }));

  sheet.mergeCells(`A1:${LAST_COLUMN}1`);
  const bannerCell = sheet.getCell('A1');
  bannerCell.value = banner;
  bannerCell.font = { ...FONT, bold: true, italic: true };
  bannerCell.fill = fill(COLOR.BANNER);
  bannerCell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  };
  sheet.getRow(1).height = 32;

  const header = sheet.getRow(2);
  HEADERS.forEach(({ header: label }, index) => {
    const cell = header.getCell(index + 1);
    const money = label === 'Đã thu tiền';
    cell.value = label;
    cell.font = {
      ...FONT,
      bold: true,
      color: { argb: money ? 'FF000000' : 'FFFFFFFF' },
    };
    cell.fill = fill(money ? COLOR.MONEY_HEADER : COLOR.HEADER);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  header.height = 24;

  const lastRow = FIRST_ROW + players.length + blankRows - 1;
  const column = (letter: string) =>
    `${letter}${FIRST_ROW}:${letter}${lastRow}`;

  for (let r = FIRST_ROW; r <= lastRow; r++) {
    const player = players[r - FIRST_ROW];
    const row = sheet.getRow(r);

    row.getCell('A').value = { formula: `IF(B${r}="","",ROW()-2)` };
    if (player) {
      row.getCell('B').value = player.name;
      row.getCell('C').value = player.jersey_number ?? null;
      row.getCell('D').value = player.jersey_name ?? null;
      row.getCell('E').value = player.shirt_size ?? null;
      row.getCell('F').value = player.short_size ?? null;
      row.getCell('G').value = player.short_form
        ? SHORT_FORM_LABELS[player.short_form]
        : null;
    }
    // Unchecked until someone ticks the box.
    row.getCell(PAID_COLUMN).value = false;
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      cell.font = FONT;
      cell.border = box;
      if (c !== 2 && c !== HEADERS.length)
        cell.alignment = { horizontal: 'center' };
    }
  }

  dropdown(sheet, column('E'), [...JERSEY_SIZES]);
  dropdown(sheet, column('F'), [...JERSEY_SIZES]);
  dropdown(sheet, column('G'), PANTS_FORMS);
  dropdown(sheet, column(PAID_COLUMN), ['TRUE', 'FALSE']);

  // Exact matches: Sheets' import of "contains text" rules painted "No" green.
  const equals = (
    letter: string,
    value: string,
    argb: string,
    priority: number,
  ) => ({
    type: 'expression' as const,
    priority,
    formulae: [`$${letter}${FIRST_ROW}="${value}"`],
    style: highlight(argb),
  });

  sheet.addConditionalFormatting({
    ref: column('G'),
    rules: [
      equals('G', PANTS_FORMS[0]!, COLOR.SHORT, 2),
      equals('G', PANTS_FORMS[1]!, COLOR.STANDARD, 3),
    ],
  });
  // Ticked turns green; unticked keeps the plain cell background.
  const paid = `$${PAID_COLUMN}${FIRST_ROW}`;
  sheet.addConditionalFormatting({
    ref: column(PAID_COLUMN),
    rules: [
      {
        type: 'expression',
        priority: 4,
        formulae: [`${paid}=TRUE`],
        style: highlight(COLOR.PAID),
      },
    ],
  });

  return { sheet, lastRow };
}

/**
 * Price is fixed per set, so totals count filled rows across both tabs and
 * multiply by the price cell.
 */
function addSummary(
  sheet: Worksheet,
  teamLastRow: number,
  outsideLastRow: number,
  price: number,
) {
  const team = (column: string) =>
    `${column}${FIRST_ROW}:${column}${teamLastRow}`;
  const outside = (column: string) =>
    `'${SHEET.OUTSIDE}'!${column}${FIRST_ROW}:${column}${outsideLastRow}`;
  const paid = (range: string) => `COUNTIF(${range},TRUE)`;

  const rows: Array<[string, number | { formula: string }, string, string]> = [
    ['Đơn giá', price, COLOR.MONEY_HEADER, MONEY_FORMAT],
    [
      'Số bộ',
      { formula: `COUNTA(${team('B')})+COUNTA(${outside('B')})` },
      COLOR.BANNER,
      '0',
    ],
    ['Tổng tiền đồ', { formula: 'L3*L2' }, COLOR.SUMMARY, MONEY_FORMAT],
    [
      'Đã thu',
      {
        formula: `(${paid(team(PAID_COLUMN))}+${paid(outside(PAID_COLUMN))})*L2`,
      },
      COLOR.PAID,
      MONEY_FORMAT,
    ],
    ['Còn lại', { formula: 'L4-L5' }, COLOR.DUPLICATE, MONEY_FORMAT],
  ];

  sheet.getColumn('K').width = 16;
  sheet.getColumn('L').width = 16;
  rows.forEach(([label, value, color, numFmt], index) => {
    const r = index + 2;
    const labelCell = sheet.getCell(`K${r}`);
    labelCell.value = label;
    labelCell.font = { ...FONT, bold: true };
    labelCell.fill = fill(color);
    const valueCell = sheet.getCell(`L${r}`);
    valueCell.value = value;
    valueCell.font = { ...FONT, bold: true };
    valueCell.numFmt = numFmt;
    valueCell.fill = fill(color);
  });
}

function addSizeSheet(workbook: Workbook, charts: Array<SizeChart>) {
  const sheet = workbook.addWorksheet(SHEET.SIZES);

  if (charts.length === 0) {
    sheet.getCell('A3').value = 'Chưa có bảng size cho nhà cung cấp này.';
    sheet.getCell('A3').font = { ...FONT, italic: true };
    return;
  }

  // 1-based row of the next title; each image sits on the rows below it.
  let row = 3;
  for (const chart of charts) {
    const title = sheet.getCell(`A${row}`);
    title.value = chart.title.toUpperCase();
    title.font = { ...FONT, size: 12, bold: true };

    const scale = Math.min(1, SIZE_CHART_MAX_WIDTH / chart.width);
    const width = Math.round(chart.width * scale);
    const height = Math.round(chart.height * scale);
    const image = workbook.addImage({ buffer: chart.buffer, extension: 'png' });
    // `tl.row` is 0-based, so `row` is the row right under the title.
    sheet.addImage(image, { tl: { col: 0, row }, ext: { width, height } });

    row += Math.ceil(height / ROW_HEIGHT_PX) + 3;
  }
}

export function buildJerseyOrder(
  workbook: Workbook,
  { players, price }: JerseyOrderOptions,
  charts: Array<SizeChart> = [],
) {
  const team = addOrderSheet(
    workbook,
    SHEET.TEAM,
    'Nếu số áo bị trùng (ô tô màu cam), các bạn trao đổi với nhau và cập nhật lại sau nhé!',
    sortPlayers(players),
    SPARE_TEAM_ROWS,
  );
  const outside = addOrderSheet(
    workbook,
    SHEET.OUTSIDE,
    'Dành cho fan, bạn bè 🤩. Số áo được phép trùng.',
    [],
    OUTSIDE_ROWS,
  );

  // Only the team sheet flags duplicates; outside orders may share numbers.
  // The rule re-evaluates on every edit, so once one player changes number the
  // other row drops back to the normal background.
  team.sheet.addConditionalFormatting({
    ref: `B${FIRST_ROW}:C${team.lastRow}`,
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: [
          `AND($C${FIRST_ROW}<>"",COUNTIF($C$${FIRST_ROW}:$C$${team.lastRow},$C${FIRST_ROW})>1)`,
        ],
        style: highlight(COLOR.DUPLICATE),
      },
    ],
  });

  addSummary(team.sheet, team.lastRow, outside.lastRow, price);
  addSizeSheet(workbook, charts);
  workbook.addWorksheet(SHEET.DESIGN);

  return workbook;
}

const imageUrl = (image: ChartSource['image']) =>
  typeof image === 'string' ? image : image.src;

/** Re-encodes an image as PNG, which exceljs can embed. */
async function toPng(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);

  const png = await new Promise<Nullable<Blob>>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!png) throw new Error('PNG encoding failed');

  return {
    buffer: await png.arrayBuffer(),
    width: bitmap.width,
    height: bitmap.height,
  };
}

/** Loads the provider's size charts as PNGs, skipping any that fail. */
export async function loadSizeCharts(
  provider: string,
): Promise<Array<SizeChart>> {
  const sources =
    UNIFORM_PROVIDERS.find(({ name }) => name === provider)?.charts ?? [];

  const charts = await Promise.all(
    sources.map(async ({ title, image }) => {
      try {
        const response = await fetch(imageUrl(image));
        if (!response.ok) return null;
        return { title, ...(await toPng(await response.blob())) };
      } catch {
        return null;
      }
    }),
  );

  return charts.filter((chart) => chart !== null);
}

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Builds the workbook as an `.xlsx` blob, loading exceljs on demand. */
export async function createJerseyOrderFile(
  options: JerseyOrderOptions,
): Promise<Blob> {
  const [{ Workbook }, charts] = await Promise.all([
    import('exceljs'),
    loadSizeCharts(options.provider),
  ]);
  const workbook = buildJerseyOrder(new Workbook(), options, charts);

  return new Blob([await workbook.xlsx.writeBuffer()], { type: XLSX_MIME });
}

export async function downloadJerseyOrder(options: JerseyOrderOptions) {
  const [file, { triggerDownload, withExtension }] = await Promise.all([
    createJerseyOrderFile(options),
    import('@/lib/download'),
  ]);

  triggerDownload(file, withExtension(jerseyOrderFilename(), '.xlsx'));
}

/**
 * Uploads the form to the user's Google Drive as a native Google Sheet and
 * returns its URL. `getToken` runs first so the sign-in tab opens straight
 * from the click. Only `paymentEditors` (plus the owner) may tick "Đã thu
 * tiền".
 */
export async function openJerseyOrderInSheets(
  options: JerseyOrderOptions,
  getToken: () => Promise<string>,
  paymentEditors: Array<string> = [],
): Promise<{
  id: string;
  url: string;
  checkboxes: boolean;
  protected: boolean;
  shared: boolean;
}> {
  const token = getToken();
  const [
    file,
    { addCheckboxes, protectRanges, shareWithAnyone, uploadAsGoogleSheet },
  ] = await Promise.all([
    createJerseyOrderFile(options),
    import('@/lib/google-drive'),
  ]);

  const { id, url } = await uploadAsGoogleSheet(
    await token,
    file,
    jerseyOrderFilename(),
  );

  // The sheet is usable either way, so report these instead of failing:
  // without the Sheets API the paid column stays a TRUE/FALSE dropdown and
  // unlocked, and without sharing only the uploader can open the link.
  const succeeded = (step: string) =>
    [
      () => true,
      (error: unknown) => {
        console.warn(`[jersey-order] ${step} failed:`, error);
        return false;
      },
    ] as const;

  const paid = paidCheckboxRanges(options.players.length);
  const [checkboxes, locked, shared] = await Promise.all([
    addCheckboxes(await token, id, paid).then(...succeeded('checkboxes')),
    protectRanges(await token, id, paid, paymentEditors, 'Đã thu tiền').then(
      ...succeeded('protection'),
    ),
    shareWithAnyone(await token, id).then(...succeeded('sharing')),
  ]);

  return { id, url, checkboxes, protected: locked, shared };
}
