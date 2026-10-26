import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getReportHistory, getReportSchedules } from '@/actions/report';

import ReportHistory from './_components/ReportHistory';
import ReportSchedules from './_components/ReportSchedules';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function ReportsPage() {
  const [schedules, history] = await Promise.all([
    getReportSchedules(),
    getReportHistory(),
  ]);

  return (
    <>
      <ReportSchedules schedules={schedules} />
      <ReportHistory history={history} />
    </>
  );
}
