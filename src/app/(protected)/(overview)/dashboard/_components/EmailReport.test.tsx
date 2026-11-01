import { useController } from 'react-hook-form';

import {
  createToasterMock,
  mockToaster,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';

import { sendReportEmail } from '@/actions/report';

import EmailReport from './EmailReport';

const RECIPIENTS = ['alice@example.com', 'bob@example.com'];
const MOCK_RECIPIENT = { name: 'Alice', email: 'alice@example.com' };

// Drive the recipients field directly instead of exercising the full
// SearchableSelectField (covered by its own suite); a button toggles the selection.
// renderItem / itemToString / itemToValue are also invoked so their bodies are covered.
vi.mock('@/components/SearchableSelect', () => ({
  SearchableSelectField: ({
    control,
    name,
    renderItem,
    itemToString,
    itemToValue,
  }: {
    control: unknown;
    name: string;
    renderItem: (item: typeof MOCK_RECIPIENT) => React.ReactNode;
    itemToString: (item: typeof MOCK_RECIPIENT) => string;
    itemToValue: (item: typeof MOCK_RECIPIENT) => string;
  }) => {
    const { field } = useController({ control: control as never, name });
    return (
      <>
        {renderItem(MOCK_RECIPIENT)}
        {itemToString(MOCK_RECIPIENT)}
        {itemToValue(MOCK_RECIPIENT)}
        <button type="button" onClick={() => field.onChange(RECIPIENTS)}>
          Select recipients
        </button>
      </>
    );
  },
}));

vi.mock('@/actions/report', () => ({
  getReportRecipients: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('EmailReport', () => {
  const mockSendReportEmail = vi.mocked(sendReportEmail);
  const mockFetch = vi.fn();
  const mockOnOpenChange = vi.fn();

  const range = { from: '2026-01-01', to: '2026-12-31' };
  const filename = 'sgr-report-01-01-2026-31-12-2026.pdf';

  const setup = (props = {}) =>
    renderWithUI(
      <EmailReport
        open
        range={range}
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
        body: JSON.stringify({ ...range, filename }),
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
      expect(mockToaster.success).toHaveBeenCalledWith(
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
      expect(mockToaster.error).toHaveBeenCalledWith({
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
      expect(mockToaster.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Email failed',
          description: 'boom',
        }),
      );
    });

    expect(mockToaster.success).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  test('shows the unknown error message when a non-Error is thrown', async () => {
    mockPdfResponse();
    mockSendReportEmail.mockRejectedValue('unexpected');

    const { user } = setup();

    await selectRecipients(user);
    await user.click(
      await screen.findByRole('button', { name: /Generate & Email/i }),
    );

    await waitFor(() => {
      expect(mockToaster.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Email failed',
          description: 'An unknown error occurred.',
        }),
      );
    });
  });

  test('calls onOpenChange with false when the close button is clicked', async () => {
    const { user } = setup();

    await screen.findByText('Email Analytics Report');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('resets the form when the dialog exits', async () => {
    const { rerender } = setup();

    await screen.findByText('Email Analytics Report');

    rerender(
      <EmailReport
        open={false}
        range={range}
        filename={filename}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByText('Email Analytics Report'),
      ).not.toBeInTheDocument(),
    );
  });
});
