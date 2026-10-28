import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { resend } from '@/lib/resend';

import EmailPreviewPage, { generateMetadata } from './page';

vi.mock('@/lib/resend', () => ({
  resend: { emails: { list: vi.fn() } },
}));

vi.mock('./_components/SentEmails', () => ({
  default: ({ emails }: { emails: Array<unknown> }) => (
    <div data-testid="sent-emails">{emails.length}</div>
  ),
}));
vi.mock('./_components/EmailPreview', () => ({
  default: () => <div data-testid="email-preview" />,
}));

describe('EmailPreviewPage', () => {
  const mockList = vi.mocked(resend.emails.list);

  setupTestLifecycle();

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Email Preview');
  });

  test('should be accessible', async () => {
    mockList.mockResolvedValue({ data: { data: [] }, error: null } as never);

    const { container } = renderWithUI(await EmailPreviewPage());

    await expectNoA11yViolations(container);
  });

  test('renders sent emails when the fetch succeeds', async () => {
    mockList.mockResolvedValue({
      data: { data: [{ id: '1' }] },
      error: null,
    } as never);

    renderWithUI(await EmailPreviewPage());

    expect(screen.getByTestId('sent-emails')).toHaveTextContent('1');
    expect(screen.getByTestId('email-preview')).toBeInTheDocument();
  });

  test('renders an error message when the fetch fails', async () => {
    mockList.mockResolvedValue({
      data: null,
      error: { message: 'Resend is down' },
    } as never);

    renderWithUI(await EmailPreviewPage());

    expect(
      screen.getByText('Error: Resend is down'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('sent-emails')).not.toBeInTheDocument();
  });
});
