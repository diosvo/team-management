import EmailLayout from '@/components/common/EmailLayout';

type ResetPasswordProps = {
  name: string;
  url: string;
};

export default function ResetPassword({
  name,
  url,
}: ResetPasswordProps): string {
  return EmailLayout(
    `<p style="font-size: 14px; margin-bottom: 16px">
      Hi <strong>${name}</strong>,
    </p>
    <p style="font-size: 14px; margin-bottom: 24px">
      Click the button below to create a new password. If you did not request this, you can ignore this email.
    </p>

    <div style="width: 100%; border: 1px dashed #e2e8f0; border-radius: 6px; text-align: center; padding-top: 16px; padding-bottom: 16px;">
      <a
        href="${url}"
        style="display: inline-block; background-color: #8c271e; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; text-decoration: none;"
      >
        Create new password
      </a>
      <p style="font-size: 10px; margin-top: 8px; margin-bottom: 0; color: #718096;">
        This link will be valid for 1 hour.
      </p>
    </div>`,
  );
}
