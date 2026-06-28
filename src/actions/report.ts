'use server';

import { fetchReportRecipients } from '@/db/report';
import { sendEmail, type EmailProps } from '@/lib/resend';

import { withAuth } from './auth';

export const getReportRecipients = withAuth(async ({ team_id }) => {
  if (!team_id) return [];
  return await fetchReportRecipients(team_id);
});

export const sendReportEmail = withAuth(
  async (_user, payload: EmailProps) => await sendEmail(payload),
);
