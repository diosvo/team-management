import { between, gte } from 'drizzle-orm';

import { MatchTable } from '@/drizzle/schema';
import { toIsoDay } from '@/utils/datetime';

import { fromNow, withinRange } from './utils';

describe('db utils', () => {
  test('fromNow keeps rows dated today or later', () => {
    fromNow(MatchTable.date);

    expect(gte).toHaveBeenCalledWith(MatchTable.date, toIsoDay(new Date()));
  });

  test('withinRange is an inclusive window on the column', () => {
    withinRange(MatchTable.date, { from: '2026-02-01', to: '2026-02-28' });

    expect(between).toHaveBeenCalledWith(
      MatchTable.date,
      '2026-02-01',
      '2026-02-28',
    );
  });
});
