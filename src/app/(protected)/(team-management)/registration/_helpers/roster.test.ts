import { MOCK_USER } from '@/test/mocks/user';

import { triggerDownload, withExtension } from '@/lib/download';

import {
  buildRosterCsv,
  COLUMNS,
  downloadCsv,
  downloadPdf,
  toRow,
} from './roster';

vi.mock('@/lib/download', () => ({
  triggerDownload: vi.fn(),
  withExtension: vi.fn((filename: string, ext: string) => `${filename}${ext}`),
}));

describe('toRow', () => {
  test('extracts every column from a player', () => {
    const player = {
      ...MOCK_USER,
      dob: '1999-05-01',
      citizen_identification: '123456789',
      phone_number: '0901234567',
      player: { jersey_number: 7 },
    } as never;

    expect(toRow(player)).toEqual({
      name: MOCK_USER.name,
      dob: '1999',
      cmnd: '123456789',
      phone: '0901234567',
      jersey: '7',
    });
  });

  test('falls back to empty strings for missing fields', () => {
    const player = {
      ...MOCK_USER,
      name: null,
      dob: null,
      citizen_identification: null,
      phone_number: null,
      player: undefined,
    } as never;

    expect(toRow(player)).toEqual({
      name: '',
      dob: '',
      cmnd: '',
      phone: '',
      jersey: '',
    });
  });
});

describe('buildRosterCsv', () => {
  test('includes the header row and one row per player', () => {
    const player = { ...MOCK_USER, dob: '2000-01-01' } as never;

    const csv = buildRosterCsv([player]);
    const [header, ...rows] = csv.split('\n');

    expect(header).toBe(COLUMNS.map((c) => c.header).join(','));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain(MOCK_USER.name);
  });

  test('quotes values containing commas, quotes or newlines', () => {
    const player = {
      ...MOCK_USER,
      name: 'Last, "Nick" Name\nSuffix',
    } as never;

    const csv = buildRosterCsv([player]);

    expect(csv).toContain('"Last, ""Nick"" Name\nSuffix"');
  });
});

describe('downloadPdf', () => {
  test('triggers a PDF download with the correct extension', () => {
    const bytes = new Uint8Array([1, 2, 3]);

    downloadPdf(bytes, 'roster');

    expect(withExtension).toHaveBeenCalledWith('roster', '.pdf');
    expect(triggerDownload).toHaveBeenCalledWith(
      expect.any(Blob),
      'roster.pdf',
    );
  });
});

describe('downloadCsv', () => {
  test('triggers a CSV download with the correct extension', () => {
    downloadCsv([MOCK_USER], 'roster');

    expect(withExtension).toHaveBeenCalledWith('roster', '.csv');
    expect(triggerDownload).toHaveBeenCalledWith(
      expect.any(Blob),
      'roster.csv',
    );
  });
});
