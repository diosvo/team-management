import {
  getPlayerActivity,
  getPlayerAttendance,
  getPlayerMatches,
  getPlayerTesting,
} from '@/actions/player-performance';
import type { DateRange } from '@/types/common';

import ActivityTable from './activity/ActivityTable';
import AttendanceOverview from './attendance/AttendanceOverview';
import MatchPerformance from './matches/MatchPerformance';
import TestingOverview from './testing/TestingOverview';

/**
 * One async server section per tab for independent fetch + streaming.
 */

type SectionProps = { target_id: string; range: DateRange };

export async function AttendanceSection({
  target_id,
  range,
  subject,
}: SectionProps & { subject: string }) {
  const data = await getPlayerAttendance(target_id, range);
  return <AttendanceOverview data={data} subject={subject} />;
}

export async function TestingSection({
  target_id,
  subject,
}: Pick<SectionProps, 'target_id'> & { subject: string }) {
  const data = await getPlayerTesting(target_id);
  return <TestingOverview data={data} subject={subject} />;
}

export async function ActivitySection({ target_id, range }: SectionProps) {
  const records = await getPlayerActivity(target_id, range);
  return <ActivityTable records={records} />;
}

export async function MatchesSection({ target_id, range }: SectionProps) {
  const data = await getPlayerMatches(target_id, range);
  return <MatchPerformance data={data} />;
}
