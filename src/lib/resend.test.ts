import { sendEmail } from './resend';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn(function () {
    return { emails: { send } };
  }),
}));

vi.mock('@env', () => ({
  default: { RESEND_API_KEY: 'test-api-key' },
}));

describe('sendEmail', () => {
  const PAYLOAD = {
    to: 'player@example.com',
    subject: 'Welcome',
    html: '<p>Hello</p>',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('sends with the shared sender and prefixed subject', async () => {
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await sendEmail(PAYLOAD);

    expect(send).toHaveBeenCalledWith({
      from: 'Acme <onboarding@resend.dev>',
      to: 'player@example.com',
      subject: 'SGR - Welcome',
      html: '<p>Hello</p>',
    });
  });

  test('supports multiple recipients', async () => {
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const recipients = ['a@example.com', 'b@example.com'];

    await sendEmail({ ...PAYLOAD, to: recipients });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: recipients }),
    );
  });

  test('returns the Resend response', async () => {
    const response = { data: { id: 'email-id' }, error: null };
    send.mockResolvedValue(response);

    await expect(sendEmail(PAYLOAD)).resolves.toBe(response);
  });

  test('propagates errors from Resend', async () => {
    send.mockRejectedValue(new Error('network down'));

    await expect(sendEmail(PAYLOAD)).rejects.toThrow('network down');
  });

  test('throws with the error message when Resend returns an error', async () => {
    send.mockResolvedValue({
      data: null,
      error: { message: 'Invalid recipient' },
    });

    await expect(sendEmail(PAYLOAD)).rejects.toThrow('Invalid recipient');
  });
});
