import EmailLayout from '@/components/common/EmailLayout';

interface ReportReadyProps {
  period: string;
  /** Present for scheduled sends (Blob link); absent for attachment emails. */
  downloadUrl?: string;
}

export default function AnalyticsReport({
  period,
  downloadUrl,
}: ReportReadyProps): string {
  return EmailLayout(`
    <p style="font-size: 14px; margin-bottom: 8px;">
      Here is the analytics overview report for the duration: <strong>${period}</strong>.
    </p>
    <p style="font-size: 14px;">
      ${
        downloadUrl
          ? `<a href="${downloadUrl}">Open or download the report</a> (sign-in required).`
          : 'Click the attachment link to open or download it.'
      }
    </p>
  `);
}
