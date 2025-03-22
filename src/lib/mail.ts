import { Response, ResponseFactory } from '@/utils/response';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<Response> => {
  const confirmLink = `http://localhost:3000/email-confirmation?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm Your Email Address -',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Email Confirmation</h2>
          <p style="color: #555; font-size: 16px;">Thank you for registering with Saigon Rovers Basketball Club. Please confirm your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #4a7aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirm Email Address</a>
          </div>
          <p style="color: #777; font-size: 14px;">If you did not create an account, you can ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e4; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2023 Saigon Rovers Basketball Club. All rights reserved.</p>
        </div>
      `,
    });
    return ResponseFactory.success('Verification email sent successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
};
