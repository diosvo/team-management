interface EmailTemplateProps {
  token: string;
  name: string;
}

export default function EmailTemplate({ token, name }: EmailTemplateProps) {
  const confirmLink = `http://localhost:3000/email-confirmation?token=${token}`;

  return `<div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      "
    >
      <div style="margin-bottom: 16px">
        <img
          src="https://sgr-portal.vercel.app/logo.png"
          width="48"
          height="48"
          alt="Saigon Rovers Basketball Club"
        />
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0" />

      <div style="padding-top: 16px; padding-bottom: 24px">
        <p style="font-size: 14px; margin: 0 0 16px 0">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size: 14px; margin: 0 0 24px 0">
          Thank you for registering with Saigon Rovers Basketball Club. Please
          confirm your email address to complete your registration. If you did
          not create an account, you can ignore this email.
        </p>

        <table
          style="
            width: 100%;
            border: 1px dashed #e2e8f0;
            border-radius: 6px;
            text-align: center;
            padding: 16px;
          "
        >
          <tr>
            <td>
              <a
                href="${confirmLink}"
                style="
                  display: inline-block;
                  background-color: #8c271e;
                  color: white;
                  padding: 8px 16px;
                  border-radius: 4px;
                  font-size: 14px;
                  text-decoration: none;
                "
              >
                Confirm your email
              </a>
              <p
                style="
                  font-size: 9px;
                  margin-top: 8px;
                  margin-bottom: 0;
                  color: #718096;
                "
              >
                This link will only be valid for the next hour.
              </p>
            </td>
          </tr>
        </table>
      </div>

      <div
        style="
          color: #718096;
          font-size: 12px;
          text-align: center;
          margin-top: 24px;
        "
      >
        <p>© 2024 Saigon Rovers Basketball Club</p>
      </div>
    </div>`;
}
