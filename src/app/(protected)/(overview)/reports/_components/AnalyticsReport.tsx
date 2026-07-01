import EmailLayout from '@/components/common/EmailLayout';

interface ReportReadyProps {
  period: string;
}

export default function AnalyticsReport({ period }: ReportReadyProps): string {
  return EmailLayout(`
    <p style="font-size: 14px; margin-bottom: 8px;">
      Here is the analytics overview report for the duration: <strong>${period}</strong>.
    </p>
    <p style="font-size: 14px;">Click the attachment link to open or download it.</p>
  `);
}
