import { Resend } from 'resend';

import env from '@env';
import { isDeliverable } from '@/utils/email';

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
  // Placeholder (`.invalid`) addresses can never receive mail
  const recipients = [to].flat().filter(isDeliverable);
  if (recipients.length === 0) {
    throw new Error('No deliverable recipients');
  }

  const response = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipients,
    subject: `SGR - ${subject}`,
    html,
    attachments,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response;
}
