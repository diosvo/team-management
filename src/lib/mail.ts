import { Resend } from 'resend';

import EmailTemplate from '@/app/(auth)/_components/email-template';
import logger from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordInstructionEmail(
  type: 'new' | 'reset',
  email: string,
  token: string
) {
  const name = email.split('@')[0];
  const subject = type === 'new' ? 'Create new password' : 'Reset password';

  try {
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject,
      html: EmailTemplate({ type, token, name }),
    });
  } catch (error) {
    logger.error('[resent] %s', error);
  }
}
