import { IntervalValues } from '@/types/common';

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

type SectionProps = { interval: IntervalValues };

export async function MatchesRateSection({ interval }: SectionProps) {
  const records = await getMatchesRate(interval);
  return <MatchesRate records={records} />;
}

export async function AttendanceTrendSection({ interval }: SectionProps) {
  const records = await getAttendanceHistory(interval);
  return <AttendanceTrend records={records} />;
}

export async function PlayerAttendanceRankingSection({
  interval,
}: SectionProps) {
  const records = await getAttendanceSummary(interval);
  return <PlayerAttendanceRanking records={records} />;
}

export async function AbsenceReasonsBreakdownSection({
  interval,
}: SectionProps) {
  const reasons = await getMostAbsenceReasons(interval);
  return <AbsenceReasonsBreakdown reasons={reasons} />;
}
