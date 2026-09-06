import type { ListEmail } from 'resend';

import {
  createPermissionsMock,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { EmailStatus } from '@/utils/enum';

import SentEmails from './SentEmails';

// Reached indirectly through useTableState.
vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

// The generic Filters component is covered by its own tests; capture the props
// SentEmails wires through to it.
const propsSpy = {
  filters: [] as Array<{ key: string; label: string }>,
  values: undefined as unknown,
  defaults: undefined as unknown,
  onApply: (() => {}) as (values: Record<string, unknown>) => void,
};

vi.mock('@/components/filters/Filters', () => ({
  default: (props: typeof propsSpy) => {
    Object.assign(propsSpy, props);
    return <div>Filters</div>;
  },
}));

describe('SentEmails', () => {
  const mockSetSearchParams = vi.fn();

  const DELIVERED_EMAIL = {
    id: 'email-1',
    to: ['coach@example.com'],
    subject: 'Weekly analytics report',
    last_event: EmailStatus.DELIVERED,
    created_at: '2026-01-01T09:00:00.000Z',
  } as unknown as ListEmail;

  const BOUNCED_EMAIL = {
    id: 'email-2',
    to: ['player@example.com'],
    subject: 'Password reset',
    last_event: EmailStatus.BOUNCED,
    created_at: '2026-01-02T09:00:00.000Z',
  } as unknown as ListEmail;

  const setup = ({
    emails = [DELIVERED_EMAIL, BOUNCED_EMAIL],
    params = {},
  }: Partial<{
    emails: Array<ListEmail>;
    params: Record<string, unknown>;
  }> = {}) => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock());
    mockUseQueryStates(
      { page: 1, q: '', status: [], ...params },
      mockSetSearchParams,
    );

    return renderWithUI(<SentEmails emails={emails} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each email', () => {
    setup();

    expect(screen.getByText(DELIVERED_EMAIL.subject)).toBeInTheDocument();
    expect(screen.getByText(BOUNCED_EMAIL.subject)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['To', 'Subject', 'Status', 'Created At'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders the recipient and the last event of an email', () => {
    setup({ emails: [DELIVERED_EMAIL] });

    expect(screen.getByText('coach@example.com')).toBeInTheDocument();
    expect(screen.getByText(EmailStatus.DELIVERED)).toBeInTheDocument();
  });

  test('shows the empty state when nothing has been sent', () => {
    setup({ emails: [] });

    expect(screen.getByText('No emails sent.')).toBeInTheDocument();
  });

  test('filters the emails by recipient', () => {
    setup({ params: { q: 'player@' } });

    expect(screen.getByText(BOUNCED_EMAIL.subject)).toBeInTheDocument();
    expect(
      screen.queryByText(DELIVERED_EMAIL.subject),
    ).not.toBeInTheDocument();
  });

  test('filters the emails by subject', () => {
    setup({ params: { q: 'analytics' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('analytics', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(BOUNCED_EMAIL.subject)).not.toBeInTheDocument();
  });

  test('filters the emails by status', () => {
    setup({ params: { status: [EmailStatus.BOUNCED] } });

    expect(screen.getByText(BOUNCED_EMAIL.subject)).toBeInTheDocument();
    expect(
      screen.queryByText(DELIVERED_EMAIL.subject),
    ).not.toBeInTheDocument();
  });

  describe('filters', () => {
    test('provides the status filter', () => {
      setup();

      expect(propsSpy.filters).toMatchObject([
        { key: 'status', label: 'Status' },
      ]);
    });

    test('resets to the first page when filters are applied', () => {
      setup();

      propsSpy.onApply({ status: [EmailStatus.OPENED] });

      expect(mockSetSearchParams).toHaveBeenCalledWith({
        status: [EmailStatus.OPENED],
        page: 1,
      });
    });
  });
});
