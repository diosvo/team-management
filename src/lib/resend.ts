import { Resend } from 'resend';

import env from '@env';

export const resend = new Resend(env.RESEND_API_KEY);
/** Shared sender identity for all transactional emails. */
const EMAIL_FROM = 'Acme <onboarding@resend.dev>';

export interface EmailProps {
  to: string | Array<string>;
  subject: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
  }>;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: EmailProps) {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `SGR - ${subject}`,
    html,
    attachments,
  });
}
