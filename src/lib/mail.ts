import { Response, ResponseFactory } from '@/utils/response';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<Response> => {
  const confirmLink = `http://localhost:3000/confirmation-email?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Hello world',
      html:
        '<p>Click <a href="' + confirmLink + '">here</a> to confirm email.</p>',
    });
    return ResponseFactory.success('Verification email sent successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
};
