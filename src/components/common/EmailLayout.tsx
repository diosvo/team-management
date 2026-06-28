const YEAR = new Date().getFullYear();

/**
 * Shared wrapper for transactional emails: logo header, divider, body slot
 * and footer. Pass the section-specific markup as `children`.
 */
export default function EmailLayout(children: string): string {
  return `
  <div style="max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 6px;">
    <div style="margin-bottom: 16px">
      <img src="https://sgr-portal.vercel.app/logo.png" alt="Saigon Rovers Basketball Club" width="64" height="64" style="display: block; width: 64px; height: 64px;" />
    </div>

    <hr style="border: none; border-top: 0.5px solid #e2e8f0; margin: 0" />

    <div style="margin-top: 16px; margin-bottom: 32px">
      ${children}
    </div>

    <div style="color: #718096; font-size: 12px; text-align: center;">
      <p>© ${YEAR} Saigon Rovers Basketball Club</p>
    </div>
  </div>`;
}
