import { Workbook } from 'exceljs';

import { triggerDownload } from '@/lib/download';
import {
  addCheckboxes,
  protectRanges,
  shareWithAnyone,
  uploadAsGoogleSheet,
} from '@/lib/google-drive';

import {
  buildJerseyOrder,
  createJerseyOrderFile,
  downloadJerseyOrder,
  jerseyOrderFilename,
  type JerseyOrderOptions,
  loadSizeCharts,
  openJerseyOrderInSheets,
  paidCheckboxRanges,
  SHEET,
  type SizeChart,
  sortPlayers,
} from './jersey-order';

vi.mock('@/lib/google-drive', () => ({
  uploadAsGoogleSheet: vi.fn(async () => ({ id: 'abc', url: 'https://sheet' })),
  addCheckboxes: vi.fn(async () => {}),
  protectRanges: vi.fn(async () => {}),
  shareWithAnyone: vi.fn(async () => {}),
}));

// Next imports images as `StaticImageData`; Vitest as plain URLs. Mock one
// chart the Next way so both shapes are loaded.
vi.mock('@/assets/providers/hoops/size-chart.webp', () => ({
  default: { src: '/next/size-chart.webp', width: 1800, height: 1000 },
}));

vi.mock('@/lib/download', () => ({
  triggerDownload: vi.fn(),
  withExtension: vi.fn((filename: string, ext: string) => `${filename}${ext}`),
}));

const OPTIONS: JerseyOrderOptions = {
  provider: 'Versus',
  price: 360_000,
  players: [
    { name: 'Thu', jersey_number: 11, jersey_name: 'Kitu' },
    { name: 'Linh', jersey_number: null, jersey_name: null },
    { name: 'Hăn', jersey_number: 14, jersey_name: 'ZAHAN' },
    {
      name: 'Ân',
      jersey_number: 0,
      jersey_name: 'Ân',
      shirt_size: 'M',
      short_size: 'L',
      short_form: 'standard',
    },
  ],
};

// 1x1 transparent PNG.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  ),
  (char) => char.charCodeAt(0),
);

const chart = (title: string, width = 1800, height = 1000): SizeChart => ({
  title,
  buffer: PNG.buffer,
  width,
  height,
});

const build = (charts: Array<SizeChart> = []) =>
  buildJerseyOrder(new Workbook(), OPTIONS, charts);

/** Writes and re-reads the workbook, like a spreadsheet app opening it. */
const reload = async (workbook: Workbook) => {
  const reloaded = new Workbook();
  await reloaded.xlsx.load(await workbook.xlsx.writeBuffer());
  return reloaded;
};

// `conditionalFormattings` is on the runtime model but missing from the
// exceljs typings.
const conditionalRules = (workbook: Workbook, name: string) =>
  (
    workbook.getWorksheet(name) as unknown as {
      conditionalFormattings: Array<{
        ref: string;
        rules: Array<{
          type: string;
          formulae?: Array<string>;
          style?: { font?: { bold?: boolean } };
        }>;
      }>;
    }
  ).conditionalFormattings.flatMap(({ rules }) => rules);

/** Image placements; `ext` is set at runtime but missing from the typings. */
const placements = (workbook: Workbook) =>
  workbook
    .getWorksheet(SHEET.SIZES)!
    .getImages()
    .map(
      ({ range }) =>
        range as unknown as {
          tl: { nativeCol: number; nativeRow: number };
          ext: { width: number; height: number };
        },
    );

/** Stubs the browser image pipeline jsdom lacks: fetch, decode, PNG encode. */
const stubImagePipeline = (fetchImpl?: () => Promise<Response>) => {
  const fetch = vi.fn(
    fetchImpl ??
      (async () =>
        new Response(new Blob([PNG], { type: 'image/webp' }), {
          status: 200,
        })),
  );
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 640, height: 480 })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(new Blob([PNG], { type: 'image/png' })),
  );
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sortPlayers', () => {
  test('orders by jersey number with unnumbered players last', () => {
    expect(sortPlayers(OPTIONS.players).map(({ name }) => name)).toEqual([
      'Ân',
      'Thu',
      'Hăn',
      'Linh',
    ]);
  });

  test('returns a sorted copy without reordering the input', () => {
    const players = [...OPTIONS.players];

    const sorted = sortPlayers(players);

    expect(sorted).not.toBe(players);
    expect(players).toEqual(OPTIONS.players);
  });

  test('breaks a jersey number tie by name', () => {
    const tied = [
      { name: 'Vy', jersey_number: 7, jersey_name: null },
      { name: 'An', jersey_number: 7, jersey_name: null },
    ];

    expect(sortPlayers(tied).map(({ name }) => name)).toEqual(['An', 'Vy']);
  });
});

describe('jerseyOrderFilename', () => {
  test('names the file after the club and the current year', () => {
    expect(jerseyOrderFilename(new Date('2026-11-13'))).toBe(
      '[Rovers] Đặt đồ - 2026',
    );
  });
});

describe('buildJerseyOrder', () => {
  test('creates the team, outside, size and design tabs in order', () => {
    expect(build().worksheets.map(({ name }) => name)).toEqual([
      SHEET.TEAM,
      SHEET.OUTSIDE,
      SHEET.SIZES,
      SHEET.DESIGN,
    ]);
  });

  test('puts the duplicate banner above size-10 Arial headers without a price column', () => {
    const team = build().getWorksheet(SHEET.TEAM)!;

    expect(String(team.getCell('A1').value)).toContain('trùng');
    expect(team.getRow(2).values).toEqual([
      undefined,
      'STT',
      'Tên',
      'Số áo',
      'Tên trên áo',
      'Size áo',
      'Size quần',
      'Loại quần',
      'Đã thu tiền',
      'Note',
      undefined,
      'Đơn giá',
      360_000,
    ]);
    expect(team.getCell('B2').font).toMatchObject({ name: 'Arial', size: 10 });
    expect(team.getCell('B3').font).toMatchObject({ name: 'Arial', size: 10 });
  });

  test('prefills sorted players, unpaid by default', () => {
    const team = build().getWorksheet(SHEET.TEAM)!;

    expect(team.getCell('B3').value).toBe('Ân');
    expect(team.getCell('C3').value).toBe(0);
    expect(team.getCell('D4').value).toBe('Kitu');
    expect(team.getCell('H3').value).toBe(false);
    expect(team.getCell('H11').value).toBe(false);
  });

  test('prefills the sizes players picked in their profile', () => {
    const team = build().getWorksheet(SHEET.TEAM)!;

    expect(team.getCell('E3').value).toBe('M');
    expect(team.getCell('F3').value).toBe('L');
    expect(team.getCell('E4').value).toBeNull();
    expect(team.getCell('G3').value).toBe('Form tiêu chuẩn');
    expect(team.getCell('G4').value).toBeNull();
  });

  test('adds non-overlapping dropdowns for sizes, pants and payment', async () => {
    const team = (await reload(build())).getWorksheet(SHEET.TEAM)!;

    for (const cell of ['E3', 'E11', 'F3', 'F11']) {
      expect(team.getCell(cell).dataValidation.formulae).toEqual([
        '"XS,S,M,L,XL,2XL,3XL,4XL"',
      ]);
    }
    expect(team.getCell('G11').dataValidation.formulae).toEqual([
      '"Form ngắn,Form tiêu chuẩn"',
    ]);
    expect(team.getCell('H11').dataValidation.formulae).toEqual([
      '"TRUE,FALSE"',
    ]);
  });

  test('totals the fixed price over the filled rows of both tabs', () => {
    const team = build().getWorksheet(SHEET.TEAM)!;
    const outside = `'${SHEET.OUTSIDE}'!`;

    expect(team.getCell('L3').value).toEqual({
      formula: `COUNTA(B3:B11)+COUNTA(${outside}B3:B32)`,
    });
    expect(team.getCell('L4').value).toEqual({ formula: 'L3*L2' });
    expect(team.getCell('L5').value).toEqual({
      formula: `(COUNTIF(H3:H11,TRUE)+COUNTIF(${outside}H3:H32,TRUE))*L2`,
    });
    expect(team.getCell('L6').value).toEqual({ formula: 'L4-L5' });
  });

  test('colours payment and pants by exact value', async () => {
    const rules = conditionalRules(await reload(build()), SHEET.TEAM);
    const formulae = rules.flatMap(({ formulae }) => formulae);

    expect(formulae).toEqual(
      expect.arrayContaining([
        '$G3="Form ngắn"',
        '$G3="Form tiêu chuẩn"',
        '$H3=TRUE',
      ]),
    );
    expect(rules.some(({ type }) => type === 'containsText')).toBe(false);
    // Unticked boxes keep the plain background.
    expect(formulae.some((formula) => formula?.includes('<>TRUE'))).toBe(false);
  });

  test('lightly highlights duplicate numbers on the team tab only', async () => {
    const reloaded = await reload(build());
    const duplicate = (name: string) =>
      conditionalRules(reloaded, name).find(({ formulae }) =>
        formulae?.[0]?.includes('COUNTIF'),
      );

    expect(duplicate(SHEET.TEAM)).toMatchObject({
      formulae: ['AND($C3<>"",COUNTIF($C$3:$C$11,$C3)>1)'],
    });
    expect(duplicate(SHEET.TEAM)?.style?.font?.bold).toBeFalsy();
    expect(duplicate(SHEET.OUTSIDE)).toBeUndefined();
  });

  test('notes missing size charts', () => {
    const workbook = build();
    const sizes = workbook.getWorksheet(SHEET.SIZES)!;

    expect(String(sizes.getCell('A3').value)).toContain('Chưa có bảng size');
    expect(placements(workbook)).toHaveLength(0);
  });

  test('stacks each chart under its uppercase title, scaled to fit', () => {
    const workbook = build([
      chart('Size đồ'),
      chart('Size quần ngắn', 900, 400),
    ]);
    const sizes = workbook.getWorksheet(SHEET.SIZES)!;

    // First image is 900x500 → 25 rows, plus a 3-row gap before the next title.
    expect(sizes.getCell('A3').value).toBe('SIZE ĐỒ');
    expect(sizes.getCell('A31').value).toBe('SIZE QUẦN NGẮN');
    expect(placements(workbook)).toEqual([
      expect.objectContaining({
        tl: expect.objectContaining({ nativeCol: 0, nativeRow: 3 }),
        ext: { width: 900, height: 500 },
      }),
      expect.objectContaining({
        tl: expect.objectContaining({ nativeCol: 0, nativeRow: 31 }),
        ext: { width: 900, height: 400 },
      }),
    ]);
  });
});

describe('loadSizeCharts', () => {
  test('returns nothing for a provider without charts', async () => {
    const fetch = stubImagePipeline();

    expect(await loadSizeCharts('Khác')).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('returns nothing for an unknown provider', async () => {
    const fetch = stubImagePipeline();

    expect(await loadSizeCharts('Unknown')).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('loads every Hoops chart as a titled PNG', async () => {
    const fetch = stubImagePipeline();

    const charts = await loadSizeCharts('Hoops');

    expect(charts.map(({ title }) => title)).toEqual([
      'Size đồ',
      'Size quần ngắn',
      'Size quần dài',
    ]);
    expect(charts[0]).toMatchObject({ width: 640, height: 480 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('fetches imported images by their URL', async () => {
    const fetch = stubImagePipeline();

    await loadSizeCharts('Hoops');

    expect(fetch).toHaveBeenCalledWith('/next/size-chart.webp');
  });

  test('skips charts that fail to load', async () => {
    stubImagePipeline(async () => new Response(null, { status: 404 }));

    expect(await loadSizeCharts('Hoops')).toEqual([]);
  });

  test('skips charts when the network fails', async () => {
    stubImagePipeline(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(await loadSizeCharts('Hoops')).toEqual([]);
  });

  test('skips charts the browser cannot encode as PNG', async () => {
    stubImagePipeline();
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback) => callback(null),
    );

    expect(await loadSizeCharts('Hoops')).toEqual([]);
  });
});

describe('createJerseyOrderFile', () => {
  test('builds an xlsx blob', async () => {
    stubImagePipeline();

    const file = await createJerseyOrderFile(OPTIONS);

    expect(file.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(file.size).toBeGreaterThan(0);
  });
});

describe('downloadJerseyOrder', () => {
  test('downloads the workbook named after the year', async () => {
    stubImagePipeline();

    await downloadJerseyOrder(OPTIONS);

    expect(triggerDownload).toHaveBeenCalledWith(
      expect.any(Blob),
      `[Rovers] Đặt đồ - ${new Date().getFullYear()}.xlsx`,
    );
  });
});

describe('openJerseyOrderInSheets', () => {
  test('asks for the token first, then uploads the form', async () => {
    stubImagePipeline();
    const getToken = vi.fn(async () => 'token');

    expect(await openJerseyOrderInSheets(OPTIONS, getToken)).toEqual({
      id: 'abc',
      url: 'https://sheet',
      checkboxes: true,
      protected: true,
      shared: true,
    });
    expect(shareWithAnyone).toHaveBeenCalledWith('token', 'abc');
    expect(getToken).toHaveBeenCalledTimes(1);
    expect(uploadAsGoogleSheet).toHaveBeenCalledWith(
      'token',
      expect.any(Blob),
      `[Rovers] Đặt đồ - ${new Date().getFullYear()}`,
    );
  });

  test('turns the paid column into checkboxes on both tabs', async () => {
    stubImagePipeline();

    await openJerseyOrderInSheets(OPTIONS, async () => 'token');

    expect(addCheckboxes).toHaveBeenCalledWith(
      'token',
      'abc',
      paidCheckboxRanges(OPTIONS.players.length),
    );
  });

  test('still opens the sheet and reports missing checkboxes', async () => {
    stubImagePipeline();
    vi.mocked(addCheckboxes).mockRejectedValueOnce(new Error('403'));

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await openJerseyOrderInSheets(OPTIONS, async () => 'token')).toEqual(
      {
        id: 'abc',
        url: 'https://sheet',
        checkboxes: false,
        protected: true,
        shared: true,
      },
    );
  });
});

describe('openJerseyOrderInSheets sharing', () => {
  test('still opens the sheet and reports a private link', async () => {
    stubImagePipeline();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(shareWithAnyone).mockRejectedValueOnce(new Error('403'));

    expect(
      await openJerseyOrderInSheets(OPTIONS, async () => 'token'),
    ).toMatchObject({ url: 'https://sheet', checkboxes: true, shared: false });
  });
});

describe('openJerseyOrderInSheets protection', () => {
  test('locks the paid column to the given editors', async () => {
    stubImagePipeline();

    await openJerseyOrderInSheets(OPTIONS, async () => 'token', [
      'me@example.com',
    ]);

    expect(protectRanges).toHaveBeenCalledWith(
      'token',
      'abc',
      paidCheckboxRanges(OPTIONS.players.length),
      ['me@example.com'],
      'Đã thu tiền',
    );
  });

  test('still opens the sheet and reports an unlocked column', async () => {
    stubImagePipeline();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(protectRanges).mockRejectedValueOnce(new Error('403'));

    expect(
      await openJerseyOrderInSheets(OPTIONS, async () => 'token'),
    ).toMatchObject({ protected: false, checkboxes: true, shared: true });
  });
});

describe('paidCheckboxRanges', () => {
  test('covers every order row of both tabs', () => {
    expect(paidCheckboxRanges(4)).toEqual([
      { sheet: 'Đội', column: 'H', fromRow: 3, toRow: 11 },
      { sheet: 'Ngoài đội', column: 'H', fromRow: 3, toRow: 32 },
    ]);
  });
});
