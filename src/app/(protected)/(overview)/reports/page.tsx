import { Metadata } from 'next';

import { Stack } from '@chakra-ui/react';

import { getReportHistory, getReportSchedules } from '@/actions/report';

import ReportHistory from './_components/ReportHistory';
import ReportSchedules from './_components/ReportSchedules';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Scheduled analytics reports and their generation history.',
};

export default async function ReportsPage() {
  const [schedules, history] = await Promise.all([
    getReportSchedules(),
    getReportHistory(),
  ]);

  return (
    <Stack gap={10}>
      <ReportSchedules schedules={schedules} />
      <ReportHistory history={history} />
    </Stack>
  );
}
