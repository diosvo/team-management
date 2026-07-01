import { fetchReportRecipients } from '@/db/report';
import { sendEmail, type EmailProps } from '@/lib/resend';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { UserRole } from '@/utils/enum';

import { getReportRecipients, sendReportEmail } from './report';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/report', () => ({
  fetchReportRecipients: vi.fn(),
}));

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
}));

const MOCK_RECIPIENTS = [
  {
    id: 'user-123',
    name: 'Dios Vo',
    email: 'vtmn1212@gmail.com',
    role: UserRole.COACH,
  },
  {
    id: 'user-456',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: UserRole.PLAYER,
  },
];

describe('Report Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReportRecipients', () => {
    test('calls fetchReportRecipients with team_id', async () => {
      vi.mocked(fetchReportRecipients).mockResolvedValue(MOCK_RECIPIENTS);

      const result = await getReportRecipients();

      expect(fetchReportRecipients).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_RECIPIENTS);
    });

    test('returns empty array when no recipients exist', async () => {
      vi.mocked(fetchReportRecipients).mockResolvedValue([]);

      const result = await getReportRecipients();

      expect(result).toEqual([]);
    });

    test('propagates errors from fetchReportRecipients', async () => {
      const message = 'Database error';
      vi.mocked(fetchReportRecipients).mockRejectedValue(new Error(message));

      await expect(getReportRecipients()).rejects.toThrow(message);
    });
  });

  describe('sendReportEmail', () => {
    const PAYLOAD: EmailProps = {
      to: ['coach@example.com'],
      subject: 'Weekly Report',
      html: '<p>Report</p>',
      attachments: [{ content: 'base64', filename: 'report.pdf' }],
    };

    test('calls sendEmail with the payload and returns the response', async () => {
      const response = { data: { id: 'email-id' }, error: null };
      vi.mocked(sendEmail).mockResolvedValue(
        response as Awaited<ReturnType<typeof sendEmail>>,
      );

      const result = await sendReportEmail(PAYLOAD);

      expect(sendEmail).toHaveBeenCalledWith(PAYLOAD);
      expect(result).toEqual(response);
    });

    test('propagates errors from sendEmail', async () => {
      const message = 'network down';
      vi.mocked(sendEmail).mockRejectedValue(new Error(message));

      await expect(sendReportEmail(PAYLOAD)).rejects.toThrow(message);
    });
  });
});
