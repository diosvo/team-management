import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PDFDocument } from 'pdf-lib';

import { MOCK_USER } from '@/test/mocks/user';

import type { League } from '@/drizzle/schema';
import type { User } from '@/drizzle/schema/user';

import { buildRegistrationPdf, generateDefaultRosterPdf } from './pdf';

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

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
    const league = { name: 'Summer League' } as League;

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
    const players = Array.from({ length: 40 }, (_, i) =>
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
    expect(filledForm.getTextField('dienthoai_1').getText()).toBe(
      '0909999999',
    );
  });
});
