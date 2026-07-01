import { useController } from 'react-hook-form';

import { toaster } from '@/components/ui/toaster';

import { renderWithUI, screen, waitFor } from '@/test/utilities';
import { Interval } from '@/utils/enum';

import { sendReportEmail } from '@/actions/report';

import EmailReport from './EmailReport';

const RECIPIENTS = ['alice@example.com', 'bob@example.com'];

// Drive the recipients field directly instead of exercising the full
// SearchableSelect (covered by its own suite); a button toggles the selection.
vi.mock('@/components/SearchableSelect', () => ({
  default: ({ control, name }: { control: unknown; name: string }) => {
    const { field } = useController({ control: control as never, name });
    return (
      <button type="button" onClick={() => field.onChange(RECIPIENTS)}>
        Select recipients
      </button>
    );
  },
}));

vi.mock('@/actions/report', () => ({
  getReportRecipients: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EmailReport', () => {
  const mockSendReportEmail = vi.mocked(sendReportEmail);
  const mockFetch = vi.fn();
  const mockOnOpenChange = vi.fn();

  const interval = Interval.THIS_YEAR;
  const formattedPeriod = '01/01/2026 - 31/12/2026';
  const filename = 'sgr-report-01-01-2026-31-12-2026.pdf';

  const setup = (props = {}) =>
    renderWithUI(
      <EmailReport
        open
        interval={interval}
        formattedPeriod={formattedPeriod}
        filename={filename}
        onOpenChange={mockOnOpenChange}
        {...props}
      />,
    );

  const selectRecipients = (user: ReturnType<typeof setup>['user']) =>
    user.click(screen.getByRole('button', { name: 'Select recipients' }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    mockSendReportEmail.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockPdfResponse = () =>
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

  test('renders the dialog when open', async () => {
    setup();

    expect(
      await screen.findByText('Email Analytics Report'),
    ).toBeInTheDocument();
  });

  test('keeps the dialog closed when not open', () => {
    setup({ open: false });

    expect(
      screen.queryByText('Email Analytics Report'),
    ).not.toBeInTheDocument();
  });

  test('disables the submit button until recipients are selected', async () => {
    const { user } = setup();

    const submit = await screen.findByRole('button', {
      name: /Generate & Email/i,
    });
    expect(submit).toBeDisabled();

    await selectRecipients(user);

    await waitFor(() => expect(submit).toBeEnabled());
  });

  test('generates the report and emails it to the selected recipients', async () => {
    mockPdfResponse();

    const { user } = setup();

    await selectRecipients(user);
    await user.click(
      await screen.findByRole('button', { name: /Generate & Email/i }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reports/dashboard', {
        method: 'POST',
        body: JSON.stringify({ period: formattedPeriod, filename }),
      });
    });

    await waitFor(() => {
      expect(mockSendReportEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: RECIPIENTS,
          subject: 'Analytics Overview Report',
          attachments: [
            expect.objectContaining({
              filename,
              content: expect.any(String),
            }),
          ],
        }),
      );
    });

    await waitFor(() => {
      expect(toaster.success).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Email sent' }),
      );
    });
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('shows an error toast when report generation fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Something went wrong' }),
    });

    const { user } = setup();

    await selectRecipients(user);
    await user.click(
      await screen.findByRole('button', { name: /Generate & Email/i }),
    );

    await waitFor(() => {
      expect(toaster.error).toHaveBeenCalledWith({
        title: 'Download failed',
        description: 'Something went wrong',
      });
    });

    expect(mockSendReportEmail).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  test('shows an error toast when sending the email fails', async () => {
    mockPdfResponse();
    mockSendReportEmail.mockRejectedValue(new Error('boom'));

    const { user } = setup();

    await selectRecipients(user);
    await user.click(
      await screen.findByRole('button', { name: /Generate & Email/i }),
    );

    await waitFor(() => {
      expect(toaster.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Email failed',
          description: 'boom',
        }),
      );
    });

    expect(toaster.success).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });
});
