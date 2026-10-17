import type { DateRange } from '@/types/common';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMatchesRate,
  getMostAbsenceReasons,
} from '@/actions/analytics';

import {
  AbsenceReasonsBreakdown,
  AttendanceTrend,
  MatchesRate,
} from './LazyCharts';
import PlayerAttendanceRanking from './PlayerAttendanceRanking';

/**
 * One async server component per analytics card, so each section fetches in
 * parallel and streams into its own <Suspense> boundary instead of the whole
 * page waiting on the slowest query.
 */

type SectionProps = { range: DateRange };

export async function MatchesRateSection({ range }: SectionProps) {
  const records = await getMatchesRate(range);
  return <MatchesRate records={records} />;
}

export async function AttendanceTrendSection({ range }: SectionProps) {
  const records = await getAttendanceHistory(range);
  return <AttendanceTrend records={records} />;
}

export async function PlayerAttendanceRankingSection({
  range,
}: SectionProps) {
  const records = await getAttendanceSummary(range);
  return <PlayerAttendanceRanking records={records} />;
}

export async function AbsenceReasonsBreakdownSection({
  range,
}: SectionProps) {
  const reasons = await getMostAbsenceReasons(range);
  return <AbsenceReasonsBreakdown reasons={reasons} />;
}
