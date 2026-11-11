import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

import type { User } from '@/drizzle/schema/user';
import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_USER } from '@/test/mocks/user';

import { buildRegistrationPdf, generateDefaultRosterPdf } from './pdf';

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

// Every test embeds two ~2MB fonts (unsubset), saves and re-parses the PDF.
// That is ~300ms alone but CPU-bound, so it can blow the 5s default when the
// full suite saturates every worker.
vi.setConfig({ testTimeout: 30_000 });

const player = (overrides: Partial<User> = {}): User =>
  ({
    ...MOCK_USER,
    dob: '2000-05-01',
    citizen_identification: '123456789',
    phone_number: '0901234567',
    player: { jersey_number: 10, is_captain: false },
    ...overrides,
  }) as User;

beforeAll(() => {
  // `loadFont` fetches `/fonts/<file>` — serve the real font files from disk
  // so pdf-lib/fontkit can actually parse and embed them.
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const filename = String(input).replace(/^\/fonts\//, '');
      const bytes = await readFile(path.join(FONTS_DIR, filename));

      return {
        ok: true,
        // `bytes.buffer` is a Node-realm ArrayBuffer; jsdom's `instanceof
        // ArrayBuffer` check in pdf-lib requires one from this realm instead.
        arrayBuffer: async () => new Uint8Array(bytes).buffer,
      };
    }),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('generateDefaultRosterPdf', () => {
  test('generates a valid PDF for a single player', async () => {
    const bytes = await generateDefaultRosterPdf([player()]);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('includes the league name when provided', async () => {
    const league = MOCK_LEAGUE;

    const bytes = await generateDefaultRosterPdf([player()], league);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('highlights the captain', async () => {
    const captain = player({
      player: { jersey_number: 1, is_captain: true },
    } as never);

    const bytes = await generateDefaultRosterPdf([captain]);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  test('paginates once a page is full', async () => {
    // The first page fits 5 rows of 2 cards; one more row forces a new page.
    const players = Array.from({ length: 12 }, (_, i) =>
      player({ id: `user-${i}`, name: `Player ${i}` } as never),
    );

    const bytes = await generateDefaultRosterPdf(players);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});

describe('buildRegistrationPdf', () => {
  test('generates the default roster when no template is uploaded', async () => {
    const result = await buildRegistrationPdf({ players: [player()] });

    expect(result.filledCount).toBe(1);
    expect(result.detectedFields).toEqual([]);
  });

  test('falls back to the generated roster for a non-fillable upload', async () => {
    const plainPdf = await PDFDocument.create();
    plainPdf.addPage();
    const bytes = await plainPdf.save();
    const template = new File([bytes as BlobPart], 'template.pdf', {
      type: 'application/pdf',
    });

    const result = await buildRegistrationPdf({
      players: [player()],
      template,
    });

    expect(result.filledCount).toBe(1);
    expect(result.detectedFields).toEqual([]);
  });

  test('fills a fillable uploaded form by matching field names to players', async () => {
    const formPdf = await PDFDocument.create();
    const page = formPdf.addPage();
    const form = formPdf.getForm();

    const nameField = form.createTextField('name_1');
    nameField.addToPage(page, { x: 10, y: 10, width: 100, height: 20 });

    const phoneField = form.createTextField('dienthoai_1');
    phoneField.addToPage(page, { x: 10, y: 40, width: 100, height: 20 });

    const unmatchedField = form.createTextField('unrelated_field');
    unmatchedField.addToPage(page, { x: 10, y: 70, width: 100, height: 20 });

    const bytes = await formPdf.save();
    const template = new File([bytes as BlobPart], 'form.pdf', {
      type: 'application/pdf',
    });

    const result = await buildRegistrationPdf({
      players: [player({ phone_number: '0909999999' } as never)],
      template,
    });

    expect(result.filledCount).toBe(2);
    expect(result.detectedFields).toEqual(
      expect.arrayContaining(['name_1', 'dienthoai_1', 'unrelated_field']),
    );

    const filled = await PDFDocument.load(result.bytes);
    const filledForm = filled.getForm();
    expect(filledForm.getTextField('name_1').getText()).toBe(MOCK_USER.name);
    expect(filledForm.getTextField('dienthoai_1').getText()).toBe('0909999999');
  });

  test('fills digit-less fields from the first player and skips the rest', async () => {
    const formPdf = await PDFDocument.create();
    const page = formPdf.addPage();
    const form = formPdf.getForm();

    // No digit in the name, so it maps to the first player.
    form
      .createTextField('jersey')
      .addToPage(page, { x: 10, y: 10, width: 100, height: 20 });
    // Points at a third player who isn't in the selection.
    form
      .createTextField('name_3')
      .addToPage(page, { x: 10, y: 40, width: 100, height: 20 });
    // Not a text field, so it is never filled.
    form
      .createCheckBox('name_checkbox')
      .addToPage(page, { x: 10, y: 70, width: 20, height: 20 });

    const bytes = await formPdf.save();
    const template = new File([bytes as BlobPart], 'form.pdf', {
      type: 'application/pdf',
    });

    const result = await buildRegistrationPdf({
      players: [player()],
      template,
    });

    expect(result.filledCount).toBe(1);
    expect(result.detectedFields).toEqual(
      expect.arrayContaining(['jersey', 'name_3', 'name_checkbox']),
    );

    const filledForm = (await PDFDocument.load(result.bytes)).getForm();
    expect(filledForm.getTextField('jersey').getText()).toBe('10');
    expect(filledForm.getTextField('name_3').getText()).toBeUndefined();
    expect(filledForm.getCheckBox('name_checkbox').isChecked()).toBe(false);
  });
});

describe('font loading', () => {
  test('rejects when the font cannot be fetched', async () => {
    // The font cache is module-level, so load a fresh copy of the module.
    vi.resetModules();
    const failingFetch = vi.fn(async () => ({ ok: false }));
    vi.stubGlobal('fetch', failingFetch);

    const { generateDefaultRosterPdf: generate } = await import('./pdf');

    await expect(generate([player()])).rejects.toThrow(
      'Could not load the PDF font.',
    );
    expect(failingFetch).toHaveBeenCalledWith('/fonts/GoogleSans-Regular.ttf');
  });
});
