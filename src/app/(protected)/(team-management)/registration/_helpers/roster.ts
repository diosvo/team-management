import { triggerDownload, withExtension } from '@/lib/download';

import type { User } from '@/drizzle/schema/user';

/**
 * Roster columns and CSV/download helpers. Deliberately free of pdf-lib so
 * the preview table and download buttons don't pull the PDF engine (~400KB)
 * into the route's first-load JS — `./pdf` is dynamically imported only when
 * a PDF is actually built.
 */

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

export type ColumnKey = (typeof COLUMNS)[number]['key'];

const birthYear = (player: User) =>
  player.dob ? String(new Date(player.dob).getFullYear()) : '';

export const toRow = (player: User): Record<ColumnKey, string> => ({
  name: player.name ?? '',
  dob: birthYear(player),
  cmnd: player.citizen_identification ?? '',
  phone: player.phone_number ?? '',
  jersey: player.player?.jersey_number?.toString() ?? '',
});

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
