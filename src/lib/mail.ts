import { Resend } from 'resend';

import EmailTemplate from '@/app/(auth)/_components/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const name = email.split('@')[0];
  const subpath = 'new-password';

  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Password',
    html: EmailTemplate({ subpath, token, name }),
  });
}
